<?php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    exit;
}

// Handle POST request to add new bike
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Validate image upload
    if (!isset($_FILES['image'])) {
        http_response_code(400);
        echo json_encode(['status' => false, 'error' => 'Missing bike image']);
        exit;
    }

    // Validate required fields
    $requiredFields = ['storeId', 'type', 'pricePerHour', 'bikeBookingStatus'];
    foreach ($requiredFields as $field) {
        if (!isset($_POST[$field])) {
            http_response_code(400);
            echo json_encode(['status' => false, 'error' => "Missing required field: $field"]);
            exit;
        }
    }

    try {
        // Get data from the request
        $storeId = $_POST['storeId'];
        $type = $_POST['type'];
        $pricePerHour = $_POST['pricePerHour'];
        $bikeBookingStatus = $_POST['bikeBookingStatus'];

        // Handle image upload
        $target_dir = "storeBikesImages/";

        // Check if the uploads directory exists, if not, create it
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $target_file = $target_dir . basename($_FILES["image"]["name"]);
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        // Check if file is an actual image
        $check = getimagesize($_FILES["image"]["tmp_name"]);
        if ($check === false) {
            http_response_code(400);
            echo json_encode(['status' => false, 'error' => 'File is not an image.']);
            exit;
        }

        // Check file size (10MB limit)
        if ($_FILES["image"]["size"] > 10 * 1024 * 1024) { // 10MB
            http_response_code(400);
            echo json_encode(['status' => false, 'error' => 'Sorry, your file is too large.']);
            exit;
        }

        // Allow certain file formats
        if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif") {
            http_response_code(400);
            echo json_encode(['status' => false, 'error' => 'Sorry, only JPG, JPEG, PNG & GIF files are allowed.']);
            exit;
        }

        // If all checks pass, move the uploaded file to the uploads directory
        if (!move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
            http_response_code(500);
            echo json_encode(['status' => false, 'error' => 'Sorry, there was an error uploading your file.']);
            exit;
        }

        $imageUrl = $target_file;

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Begin a transaction
        $pdo->beginTransaction();

        try {
            // Prepare SQL statement for inserting new bike data
            $stmt = $pdo->prepare("
                INSERT INTO bikes_data (store_id, type, imageUrl, pricePerHour, bikeBookingStatus)
                VALUES (?, ?, ?, ?, ?)
            ");

            // Execute the statement with provided data
            $stmt->execute([$storeId, $type, $imageUrl, $pricePerHour, $bikeBookingStatus]);

            // Update rental_stores table: increase bikeleft by 1
            $updateStoreStmt = $pdo->prepare("UPDATE rental_stores SET bikeleft = bikeleft + 1 WHERE _id = ?");
            $updateStoreStmt->execute([$storeId]);

            // Commit the transaction
            $pdo->commit();

            // Respond with success status
            echo json_encode(['status' => true, 'message' => 'New bike added successfully']);
        } catch (PDOException $e) {
            // Rollback the transaction on failure
            $pdo->rollBack();
            throw $e;
        }
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Failed to add new bike']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
