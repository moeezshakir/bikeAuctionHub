<?php
// login.php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Handle login request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $email = $data['email'];
    $password = $data['password']; // Password sent from the frontend

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare SQL statement to fetch user data based on email
        $stmt = $pdo->prepare("SELECT id, password FROM `admin` WHERE email = ?");
        $stmt->execute([$email]);

        // Fetch user data from the result
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user with provided email exists
        if ($user) {
            // Verify password
            if ($password === $user['password']) { // Plain text password comparison for demo purposes
                // Password matches
                $user_id = $user['id'];

                // Fetch additional user data from admin table
                $userDataStmt = $pdo->prepare("SELECT store_id FROM `admin` WHERE id = ?");
                $userDataStmt->execute([$user_id]);
                $userData = $userDataStmt->fetch(PDO::FETCH_ASSOC);

                // Prepare response with user data
                $response = [
                    'status' => true,
                    'data' => [
                        'user_id' => $user_id,
                        'isEmailVerified' => true, // Add additional data as needed
                        'store_id' => $userData['store_id'] // Include profile picture in response
                    ]
                ];
            } else {
                // Password does not match
                $response = [
                    'status' => false,
                    'error' => 'Invalid credentials'
                ];
            }
        } else {
            // User not found
            $response = [
                'status' => false,
                'error' => 'Invalid credentials'
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
