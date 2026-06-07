<?php

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header('Content-Type: application/json');

require_once './db_config.php'; // Adjust the path as needed

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');

// Handle GET request to fetch reported issues data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Connect to the database using PDO
        $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_DATABASE, DB_USERNAME, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch all reported issues from report_issues table
        $issuesStmt = $pdo->prepare("SELECT user_id, title, description, submit_time FROM report_issues");
        $issuesStmt->execute();
        $issues = $issuesStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($issues) {
            $response = [
                'status' => true,
                'data' => $issues
            ];
        } else {
            // No issues found
            $response = [
                'status' => false,
                'error' => 'No issues found'
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
