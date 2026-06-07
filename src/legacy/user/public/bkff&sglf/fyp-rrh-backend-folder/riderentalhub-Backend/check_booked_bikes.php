<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    exit;
}

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);

        // Validate and sanitize input (not shown for brevity)
        $user_id = $data['userId']; // Assuming userId is sent in the request

        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Check if the user has booked any bikes
        $stmt = $pdo->prepare("SELECT * FROM booked_bikes WHERE userId = ?");
        $stmt->execute([$user_id]);
        $bookedBikes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($bookedBikes) {
            // User has booked bikes
            http_response_code(200);
            echo json_encode(['message' => 'User has booked bikes', 'bookedBikes' => $bookedBikes]);
        } else {
            // User has not booked any bikes
            http_response_code(404);
            echo json_encode(['message' => 'User has not booked any bikes']);
        }
    } catch (PDOException $e) {
        error_log('PDOException: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Failed to fetch booked bikes']);
    } catch (Exception $e) {
        error_log('Exception: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'An unexpected error occurred']);
    }
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
}
