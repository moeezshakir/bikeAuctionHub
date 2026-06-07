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

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate incoming data
    if (!isset($data['userId']) || !isset($data['amount'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing userId or amount']);
        exit;
    }

    $userId = $data['userId'];
    $amount = floatval($data['amount']); // Convert amount to float

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Update the remaining balance
        $updateStmt = $pdo->prepare("UPDATE wallet SET remainingBalance = remainingBalance + ? WHERE userId = ?");
        $updateStmt->execute([$amount, $userId]);

        // Fetch the new balance
        $balanceStmt = $pdo->prepare("SELECT remainingBalance FROM wallet WHERE userId = ?");
        $balanceStmt->execute([$userId]);
        $wallet = $balanceStmt->fetch(PDO::FETCH_ASSOC);
        $newBalance = $wallet['remainingBalance'];

        // Prepare success response with the new balance
        $response = [
            'status' => true,
            'data' => [
                'user_id' => $userId,
                'newBalance' => number_format($newBalance, 2)
            ]
        ];
    } catch (PDOException $e) {
        // Log PDO exceptions for debugging
        error_log('PDOException: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'Database error'
        ];
    } catch (Exception $e) {
        // Log other exceptions for debugging
        error_log('Exception: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'An unexpected error occurred'
        ];
    }

    // Send JSON response
    echo json_encode($response);
    exit; // Ensure script terminates after sending response
} else {
    // Handle invalid HTTP method
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
