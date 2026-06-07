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

        // Prepare SQL statement to fetch user data based on email and account verification status
        $stmt = $pdo->prepare("
            SELECT rrh_registered_user.id, rrh_registered_user.password, rrh_user.account_verified_status, rrh_user.profile_pic
            FROM rrh_registered_user
            JOIN rrh_user ON rrh_registered_user.id = rrh_user.id
            WHERE rrh_registered_user.email = ?
        ");
        $stmt->execute([$email]);

        // Fetch user data from the result
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user with provided email exists
        if ($user) {
            // Check if the account is verified
            if ($user['account_verified_status'] == 1) {
                // Verify password
                if (password_verify($password, $user['password'])) {
                    // Password matches
                    $user_id = $user['id'];

                    // Prepare response with user data
                    $response = [
                        'status' => true,
                        'data' => [
                            'user_id' => $user_id,
                            'isEmailVerified' => true, // Add additional data as needed
                            'profile_pic' => $user['profile_pic'] // Include profile picture in response
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
                // Account is not verified
                $response = [
                    'status' => false,
                    'error' => 'Please verify your email address first',
                    'userEmail' => $email,
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
