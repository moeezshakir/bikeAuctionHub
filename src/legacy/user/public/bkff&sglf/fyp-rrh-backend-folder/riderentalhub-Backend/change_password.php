<?php
// change_password.php

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

// Handle POST request to change the password
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate required fields
    $requiredFields = ['user_id', 'new_password'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            echo json_encode([
                'status' => false,
                'error' => "Missing required field: $field"
            ]);
            exit;
        }
    }

    $user_id = $data['user_id'];
    $new_password = $data['new_password'];
    $hashed_new_password = password_hash($new_password, PASSWORD_BCRYPT);

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Update the password in the database
        $stmt = $pdo->prepare("UPDATE rrh_registered_user SET password = ? WHERE id = ?");
        $stmt->execute([$hashed_new_password, $user_id]);

        $response = [
            'status' => true,
            'message' => 'Password updated successfully'
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
}
