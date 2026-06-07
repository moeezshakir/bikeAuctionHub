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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $postData = json_decode(file_get_contents("php://input"), true);

    try {
        // Assuming you receive bikeId, storeId, type, imageUrl, pricePerHour, bikeBookingStatus from the frontend
        $bikeId = $postData['bikeId'];
        $storeId = $postData['storeId'];
        $type = $postData['type'];
        $imageUrl = $postData['imageUrl'];
        $pricePerHour = $postData['pricePerHour'];
        $bikeBookingStatus = $postData['bikeBookingStatus'];

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare SQL statement for updating bike data
        $stmt = $pdo->prepare("
            UPDATE bikes_data
            SET type = ?, imageUrl = ?, pricePerHour = ?, bikeBookingStatus = ?
            WHERE store_id = ? AND id = ?
        ");

        // Execute the statement with provided data
        $stmt->execute([$type, $imageUrl, $pricePerHour, $bikeBookingStatus, $storeId, $bikeId]);

        // Check if any row was affected
        if ($stmt->rowCount() > 0) {
            echo json_encode(['status' => true, 'message' => 'Bike details updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['status' => false, 'error' => 'Bike not found']);
        }
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'Failed to update bike details']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['status' => false, 'error' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'error' => 'Method not allowed']);
}
