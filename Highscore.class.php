<?php

require_once 'defs.php'; // Include definitions, e.g., database connection functions

// HighScoreHandler class to handle high score operations
class HighScoreHandler
{
    private $db; // Database connection property

    // Constructor to initialize the database connection
    public function __construct()
    {
        $this->db = getDatabaseConnection(); // Establish a connection to the database
        if ($this->db->connect_error) {
            die("Connection failed: " . $this->db->connect_error); // Terminate if connection fails
        }
    }

    // Method to store the high score for a given user
    public function storeScore($username, $avatar, $score)
    {
        // Prepare an SQL statement to insert a new high score
        $stmt = $this->db->prepare("INSERT INTO highscore (username, avatar, score) VALUES (?, ?, ?)");
        $stmt->bind_param('ssi', $username, $avatar, $score); // Bind parameters: username, avatar, and score

        // Execute the statement and return a success or error message
        if ($stmt->execute()) {
            return "Score saved successfully.";
        } else {
            return "Error saving score: " . $stmt->error; // Return error message if execution fails
        }
    }

    // Destructor to close the database connection when the object is destroyed
    public function __destruct()
    {
        $this->db->close(); // Close the database connection
    }

    // Method to retrieve the top 10 high scores from the database
    public function getTopScores()
    {
        // Prepare an SQL statement to select the top 10 high scores
        $stmt = $this->db->prepare("SELECT username, avatar, MAX(score) AS score
        FROM highscore
        GROUP BY username
        ORDER BY score DESC
        LIMIT 10");
        $stmt->execute(); // Execute the statement
        $stmt->store_result(); // Store the result set
        $stmt->bind_result($username, $avatar, $score); // Bind the result columns to variables

        $scores = array(); // Initialize an empty array to store the high scores

        // Fetch each row of the result set and add it to the scores array
        while ($stmt->fetch()) {
            $scores[] = array('username' => $username, 'avatar' => $avatar, 'score' => $score);
        }

        return $scores; // Return the array of high scores
    }
}

// Handle a POST request to save a high score
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username']; // Retrieve username from POST request
    $avatar = $_POST['avatar']; // Retrieve avatar URL from POST request
    $score = $_POST['score']; // Retrieve score from POST request

    $highScoreHandler = new HighScoreHandler(); // Create an instance of HighScoreHandler
    $resultMessage = $highScoreHandler->storeScore($username, $avatar, $score); // Store score and get result message

    echo $resultMessage; // Output the result message to the client
}
