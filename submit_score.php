<?php
require_once 'OAuth.class.php';
require_once 'Highscore.class.php';

// Check if user is logged in and required data is available
$handler = new ProviderHandler();
$highscoreHandler = new HighScoreHandler();

$username = $_POST['username'];
$avatar = $_POST['avatar'];
$finalScore = $_COOKIE['final_score'];

// Store the score
$highscoreHandler->storeScore($username, $avatar, $finalScore);

// Reset the final_score cookie
setcookie('final_score', 0); // Adjust expiry time if needed

echo json_encode(['status' => 'success']);
exit;
