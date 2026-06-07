<?php
// forgot_password.php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Function to generate a random OTP
function generateOTP()
{
    return rand(10000, 99999); // Generate a 5-digit random number
}

// Handle forgot password request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $email = $data['email'];

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Prepare SQL statement to check if email exists in the registered user table
        $stmt = $pdo->prepare("SELECT id, email FROM rrh_registered_user WHERE email = ?");
        $stmt->execute([$email]);

        // Fetch user_id and email from the result
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check if user with provided email exists
        if ($row) {
            // Email exists
            $user_id = $row['id'];
            $email_found = $row['email'];

            // Generate OTP and set expiration time
            $otp = generateOTP();
            $expiration_time = date('Y-m-d H:i:s', strtotime('+10 minutes'));

            // Check if the user_id already exists in otp_verification table
            $checkOtpStmt = $pdo->prepare("SELECT user_id FROM otp_verification WHERE user_id = ?");
            $checkOtpStmt->execute([$user_id]);
            $otpRow = $checkOtpStmt->fetch(PDO::FETCH_ASSOC);

            if ($otpRow) {
                // Update existing OTP record
                $updateOtpStmt = $pdo->prepare("UPDATE otp_verification SET otp = ?, expiration_time = ? WHERE user_id = ?");
                $updateOtpStmt->execute([$otp, $expiration_time, $user_id]);
            } else {
                // Insert new OTP record
                $otpInsertStmt = $pdo->prepare("INSERT INTO otp_verification (user_id, otp, expiration_time) VALUES (?, ?, ?)");
                $otpInsertStmt->execute([$user_id, $otp, $expiration_time]);
            }

            $response = [
                'status' => true,
                'message' => 'Email found and OTP sent.',
                'user_id' => $user_id,
                'email_frs' => $email_found
            ];

            // Here you can implement the logic to send the OTP to the user's email address
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
