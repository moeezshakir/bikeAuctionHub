<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');
error_reporting(E_ALL);

$response = [];

try {
    // Database connection
    $pdo = new PDO("mysql:host=localhost;dbname=if0_36679809_ridehub", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Get input data from request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Check if userId is provided
    if (!isset($data['userId'])) {
        $response = ['status' => false, 'error' => 'User ID not provided'];
        echo json_encode($response);
        exit;
    }

    // Extract userId from input
    $userId = $data['userId'];

    // Check if the user ID exists in the rrh_user_requiredinfo table
    $stmt = $pdo->prepare("SELECT * FROM rrh_user_requiredinfo WHERE userId = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // User exists, return user data
        $response = ['status' => true, 'data' => $user];
    } else {
        // User does not exist
        $response = ['status' => false, 'error' => 'User not found'];
    }
} catch (PDOException $e) {
    error_log('PDOException: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'Database error.'];
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'An unexpected error occurred.'];
}

echo json_encode($response);
