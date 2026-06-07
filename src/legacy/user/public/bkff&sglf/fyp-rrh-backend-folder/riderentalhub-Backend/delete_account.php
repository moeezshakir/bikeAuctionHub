<?php
// delete_account.php

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

// Handle POST request to delete the account
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get data from the request
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Validate required fields
    $requiredFields = ['user_id'];
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

    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Begin transaction
        $pdo->beginTransaction();

        // Remove user from otp_verification table
        $stmt = $pdo->prepare("DELETE FROM otp_verification WHERE user_id = ?");
        $stmt->execute([$user_id]);

        // First, remove awards associated with the user from awards table
        $stmt = $pdo->prepare("DELETE FROM awards WHERE id IN (SELECT award_id FROM user_awards WHERE user_id = ?)");
        $stmt->execute([$user_id]);

        // Remove user from users_awards table
        $stmt = $pdo->prepare("DELETE FROM users_awards WHERE user_id = ?");
        $stmt->execute([$user_id]);

        // Remove user from social_links table
        $stmt = $pdo->prepare("DELETE FROM social_links WHERE user_id = ?");
        $stmt->execute([$user_id]);

        // Remove user from rrh_user table
        $stmt = $pdo->prepare("DELETE FROM rrh_user WHERE id = ?");
        $stmt->execute([$user_id]);

        // Finally, remove user from rrh_registered_user table
        $stmt = $pdo->prepare("DELETE FROM rrh_registered_user WHERE id = ?");
        $stmt->execute([$user_id]);

        // Commit transaction
        $pdo->commit();

        $response = [
            'status' => true,
            'message' => 'Account deleted successfully'
        ];
    } catch (PDOException $e) {
        // Rollback transaction if something goes wrong
        $pdo->rollBack();

        // Log PDO exceptions for debugging
        error_log('PDOException: ' . $e->getMessage());
        $response = [
            'status' => false,
            'error' => 'Database error'
        ];
    } catch (Exception $e) {
        // Rollback transaction if something goes wrong
        $pdo->rollBack();

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
