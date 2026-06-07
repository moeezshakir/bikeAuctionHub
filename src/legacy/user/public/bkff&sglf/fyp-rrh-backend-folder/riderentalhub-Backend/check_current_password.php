<?php
// check_current_password.php

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

// Handle POST request to check current password
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate required fields
    $requiredFields = ['user_id', 'current_password'];
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
    $current_password = $data['current_password'];

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch the current hashed password from the database
        $stmt = $pdo->prepare("SELECT password FROM rrh_registered_user WHERE id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $hashed_password = $row['password'];

            // Verify the current password with the hashed password
            if (password_verify($current_password, $hashed_password)) {
                $response = [
                    'status' => true,
                    'message' => 'Current password is correct'
                ];
            } else {
                $response = [
                    'status' => false,
                    'error' => 'Incorrect current password'
                ];
            }
        } else {
            $response = [
                'status' => false,
                'error' => 'User not found'
            ];
        }
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
