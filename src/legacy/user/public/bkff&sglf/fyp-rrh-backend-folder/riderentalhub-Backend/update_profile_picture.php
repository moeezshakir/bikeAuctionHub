<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Content-Type: application/json');

// Include database configuration file
require_once './db_config.php'; // Adjust the path as needed

// Function to connect to your database
function connectToDatabase()
{
    $servername = DB_SERVER;
    $username = DB_USERNAME;
    $password = DB_PASSWORD;
    $dbname = DB_DATABASE;

    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        // Set the PDO error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        error_log("Connection failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Database connection failed"]);
        exit;
    }
}

// Handle POST request to update user profile picture
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if image and user_id are provided
    if (isset($_FILES['image']) && isset($_POST['user_id'])) {
        $userId = intval($_POST['user_id']);
        $target_dir = "uploads/";

        // Check if the uploads directory exists, if not, create it
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $target_file = $target_dir . basename($_FILES["image"]["name"]);
        $uploadOk = 1;
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        // Check if file is an actual image or fake image
        $check = getimagesize($_FILES["image"]["tmp_name"]);
        if ($check !== false) {
            $uploadOk = 1;
        } else {
            http_response_code(400);
            echo json_encode(["error" => "File is not an image."]);
            exit;
        }

        // Check if file already exists
        if (file_exists($target_file)) {
            http_response_code(400);
            echo json_encode(["error" => "Sorry, file already exists."]);
            exit;
        }

        // Check file size (10MB limit)
        if ($_FILES["image"]["size"] > 10 * 1024 * 1024) { // 10MB
            http_response_code(400);
            echo json_encode(["error" => "Sorry, your file is too large."]);
            exit;
        }

        // Allow certain file formats
        if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif") {
            http_response_code(400);
            echo json_encode(["error" => "Sorry, only JPG, JPEG, PNG & GIF files are allowed."]);
            exit;
        }

        // If all checks pass, move the uploaded file to the uploads directory
        if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
            $profilePicUrl = $target_file;

            // Connect to database
            $conn = connectToDatabase();

            try {
                // Update profile picture URL in the database
                $stmt = $conn->prepare("UPDATE rrh_user SET profile_pic = ? WHERE id = ?");
                $stmt->execute([$profilePicUrl, $userId]);

                // Check if update was successful
                if ($stmt->rowCount() > 0) {
                    $response = [
                        'status' => true,
                        'message' => 'Profile picture updated successfully',
                        'image_path' => $profilePicUrl
                    ];
                } else {
                    http_response_code(500);
                    echo json_encode(["error" => "Failed to update profile picture"]);
                    exit;
                }
            } catch (PDOException $e) {
                error_log('PDOException: ' . $e->getMessage());
                http_response_code(500);
                echo json_encode(["error" => "Database error"]);
                exit;
            }

            // Close statement and database connection
            $stmt = null;
            $conn = null;

            // Send JSON response
            echo json_encode($response);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Missing user ID or image file"]);
        exit;
    }
}

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Allow the specified headers and methods
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(200);
    exit;
}

// Handle unsupported request methods
http_response_code(405);
echo json_encode(["error" => "Invalid request method"]);
exit;
