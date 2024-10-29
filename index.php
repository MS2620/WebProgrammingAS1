<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Assignment 1</title>
  <script src="./Box2dWeb-2.1.a.3.min.js"></script>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="./easel.min.js"></script>
  <script src="./preload.min.js"></script>

  <?php
require_once 'OAuth.class.php';
$handler = new ProviderHandler();
require_once 'Highscore.class.php';
$highscoreHandler = new HighScoreHandler();
$env = parse_ini_file('.env');
$discordcid = $env['DISCORD_CID'];
$discordcs = $env['DISCORD_CSECRET'];
$githubcid = $env['GITHUB_CID'];
$githubcs = $env['GITHUB_CSECRET'];
$handler->addProvider('Discord', $discordcid, $discordcs);
$handler->addProvider('Github', $githubcid, $githubcs);
$handler->performAction();

// if (!isset($_COOKIE['final_score'])) {
//     setcookie('final_score', 0);
// }

?>

  <style>
    body {
      display: flex;
      justify-content: center; /* Center horizontally */
      align-items: center;     /* Center vertically */
      height: 100vh;          /* Full viewport height */
      margin: 0;              /* Remove default margin */
    }
    #game_content {
      display: none;
      width: 1200px;
      height: 800px;
      position: relative;
    }
    #easelcan {
      border-radius: 5%;
      width: 100%;
      height: 100%;
    }
    #fps {
      color: white;
      font-weight: bold;
      position: absolute;
      cursor: none;
      top: 20px;
      right: 80px;
      margin: 10px;
      padding: 10px;
      border-radius: 5px;
      background-color: #7289DA;
    }
    #score {
      color: white;
      font-weight: bold;
      position: absolute;
      cursor: none;
      top: 20px;
      right: 240px;
      margin: 10px;
      padding: 10px;
      border-radius: 5px;
      background-color: #7289DA;
    }
    #start_screen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: row;
      z-index: 100;
    }
    #screen_content {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      color: white;
      text-align: center;
    }
    #user_img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
    }
    #play_btn {
      padding: 10px 20px;
      background-color: #7289DA;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
    }
    #back_btn {
      position: absolute;
      top: 15px;
      left: 80px;
      padding: 10px 20px;
      background-color: #7289DA;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
    }
    .btn {
      padding: 10px 20px;
      background-color: #7289DA;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 20px;
      margin-right: 10px;
    }
    #play_logout {
      display: flex;
      flex-direction: column; /* Arrange buttons in a column */
      align-items: center;    /* Center the buttons */
    }
    #title {
      display: flex;
      flex-direction: column; /* Arrange title and buttons in a column */
      align-items: center;    /* Center the title */
      margin-right: 20px;    /* Space between title section and highscores */
      width: 500px;
    }
    #info_btn {
      background-color: transparent;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      margin-left: 10px;
    }
    #info_screen {
      display: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 100;
      color: white;
    }
    #close_btn {
      background-color: transparent;
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 18px;
      color: red;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      margin-left: 10px;
    }
    #game_over {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 100;
    }
    #map_win {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 100;
    }
    #lvl_score {
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    #time {
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    #final_score {
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    #highscores {
      width: 200px; /* Set a fixed width for the highscores div */
      border: 1px solid #ccc; /* Optional border */
      padding: 10px; /* Add some padding */
      background-color: rgba(0, 0, 0, 0.3); /* Background color */
      border-radius: 5px; /* Rounded corners */
      box-shadow: 0 0 5px rgba(0,0,0,0.1); /* Subtle shadow */
      color: black; /* Text color */
    }
    .highscore_entry {
      display: flex;
      color: black; /* Text color */
      align-items: center;
      justify-content: center;
      margin-bottom: 5px; /* Space between entries */
    }
    .highscore_entry img {
      margin-right: 10px; /* Space between image and text */
    }
    a{
      color: white;
      text-decoration: none;
    }
  </style>
</head>

<body>
<div id="start_screen">
    <div id="screen_content">
      <div id="title">
        <h1>Assignment 1</h1>
        <button id="info_btn" onClick="showInfo()">&#9432;</button>
        <div id="play_logout">
          <?php
if ($handler->status == 'Logged out' || $handler->status == null) {
    echo '<p>To play the game, please log in with one of the following providers:</p>';
    echo $handler->generateLoginText();
} else {
    echo '<p>Logged in as ' . $handler->providerInstance->getName() . '</p>';
    echo '<img id="user_img" src="' . $handler->providerInstance->getAvatar() . '" />';
    echo '<button class="btn" id="play" onClick="startGame()">Play</button>';
    echo $handler->generateLogout();
}
?>
        </div>
      </div>
      <div id="highscores">
        <h2>Highscores</h2>
        <div id="highscores_list">
          <?php
// Fetch and display highscores from the database
$scores = $highscoreHandler->getTopScores();

foreach ($scores as $score) {
    echo '<div class="highscore_entry">';
    echo '<img src="' . htmlspecialchars($score['avatar']) . '" alt="' . htmlspecialchars($score['username']) . ' avatar" style="width: 30px; height: 30px; border-radius: 50%;">';
    echo '<span>' . htmlspecialchars($score['username']) . ': ' . htmlspecialchars($score['score']) . '</span>';
    echo '</div>';
}

?>
        </div> <!-- End of highscores_list -->
      </div> <!-- End of highscores div -->
    </div> <!-- End of screen_content -->

    <div id="game_content">
      <p id="fps"></p>
      <p id="score"></p>
      <button id="back_btn" onClick="backToMenu()">< Back</button>
      <canvas id="easelcan" width="1200" height="800"></canvas>
      <div id="map_win" style="display: none;" width="1200" height="800">
        <h1 style="color: white;">You have completed the level!</h1>
        <p id="time"></p>
        <p id="lvl_score"></p>
        <button class="btn" onClick="nextLvl()">Next Level</button>
      </div>
      <div id="game_over" style="display: none;" width="1200" height="800">
        <h1 style="color: white;">You have completed the game!</h1>
        <p id="final_score"></p>
        <button class="btn" onClick="restartGame()">Restart</button>
      </div>
    </div>
  </div>


  <div id="info_screen">
    <div id="title">
      <h1>Assignment 1</h1>
      <p>In order to get the highest score you must collect all the mushrooms and also try and complete the level as quickly as possible as this can give you up to 5x you score. </p>
      <button id="close_btn" onClick="hideInfo()">Close &#120;</button>
    </div>

    <h2>Controls:</h2>
    <p>Right/ Left Arrow Keys - Move</p>
    <p>Up Arrow - Jump</p>

    <h3>Created By: Mauro Sousa, 08013495</h3>
  </div>

  <script>
    // Set the paused variable based on PHP login status
    var paused = <?php echo json_encode($handler->status != 'Logged in'); ?>; // If not logged in, paused is true
    var username = <?php
if ($handler->status != 'Logged in') {
    echo json_encode("Guest");
} else {
    echo json_encode($handler->providerInstance->getName());
}
?>;
    var avatar = <?php
if ($handler->status != 'Logged in') {
    echo json_encode("https://via.placeholder.com/150");
} else {
    echo json_encode($handler->providerInstance->getAvatar());
}
?>;

    function startGame() {
      if (parseInt(localStorage.getItem("map_level")) === null) {
        localStorage.setItem("map_level", "1");
      }
      document.getElementById('game_content').style.display = 'block';
      document.getElementById('screen_content').style.display = 'none';
      paused = false; // Allow the game to start
    }

    function nextLvl() {
      window.location.reload();
    }

    function restartGame() {
    fetch('submit_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            username: <?php echo json_encode($handler->providerInstance->getName()); ?>,
            avatar: <?php echo json_encode($handler->providerInstance->getAvatar()); ?>,
            score: <?php echo json_encode($_COOKIE['final_score']); ?>
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            localStorage.setItem("map_level", "1");
            window.location.href = "index.php";
        } else {
            console.error('Error storing score');
        }
    })
    .catch(error => console.error('Request failed', error));
}

    function backToMenu() {
      document.getElementById('game_content').style.display = 'none';
      document.getElementById('screen_content').style.display = 'flex';
      paused = true; // Pause the game
    }

    function showInfo() {
      document.getElementById('screen_content').style.display = 'none';
      document.getElementById('info_screen').style.display = 'flex';
    }

    function hideInfo() {
      document.getElementById('info_screen').style.display = 'none';
      document.getElementById('screen_content').style.display = 'flex';
    }
  </script>
  <script src="./main.js"></script>
</body>
</html>
