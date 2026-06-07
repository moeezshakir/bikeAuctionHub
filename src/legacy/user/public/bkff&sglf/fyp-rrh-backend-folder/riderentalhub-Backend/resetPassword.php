<?php
// reset_password.php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
// error_reporting(E_ALL);
// ini_set('display_errors', 1);
// ini_set('log_errors', 1);
// ini_set('error_log', 'php-error.log');

// Handle reset password request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_BCRYPT); // Hash the new password

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare SQL statement to check if email exists in the registered user table
        $stmt = $pdo->prepare("SELECT id FROM rrh_registered_user WHERE email = ?");
        $stmt->execute([$email]);

        // Fetch user_id from the result
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user with provided email exists
        if ($row) {
            // Email exists, update the password
            $updateStmt = $pdo->prepare("UPDATE rrh_registered_user SET password = ? WHERE email = ?");
            $updateStmt->execute([$password, $email]);

            $response = [
                'status' => true,
                'message' => 'Password updated successfully.'
            ];
        } else {
            // Email not found
            $response = [
                'status' => false,
                'error' => 'Email not found'
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
