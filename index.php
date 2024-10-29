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
  require_once('OAuth.class.php');
  $handler = new ProviderHandler();
  $env = parse_ini_file('.env');
  $discordcid = $env['DISCORD_CID'];
  $discordcs = $env['DISCORD_CSECRET'];
  $githubcid = $env['GITHUB_CID'];
  $githubcs = $env['GITHUB_CSECRET'];
  $handler->addProvider('Discord', $discordcid, $discordcs);
  $handler->addProvider('Github', $githubcid, $githubcs);
  $handler->performAction();
  ?>

  <style>
    #game_content {
      display: none;
    }
    #easelcan {
      border-radius: 5%;
    }
    #fps {
      color: black;
      font-weight: bold;
      position: absolute;
      top: 260px;
      right: 80px;
      margin: 10px;
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
      flex-direction: column;
      z-index: 100;
    }
    #screen_content {
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
      top: 230px;
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
      justify-content: center;
      align-items: center;
    }
    #title {
      display: flex;
      justify-content: center;
      align-items: center;
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
      </div>
      <?php 
        if($handler->status == 'Logged out' || $handler->status == null) {
          echo '<p>To play the game, please log in with one of the following providers:</p>';
          echo $handler->generateLoginText();
        }

        if($handler->status == 'Logged in') {
          echo '<p>Logged in as ' . $handler->providerInstance->getName() . '</p>';
          echo '<img id="user_img" src="' . $handler->providerInstance->getAvatar() . '" />';
          echo '<div id="play_logout">';
          echo $handler->generateLogout();
          echo '<button class="btn" id="play" onClick="startGame()">Play</button>';
          echo '</div>';
        }
      ?>
    </div>
    
    
    <div id="game_content">
      <p id="fps"></p>
      <button id="back_btn" onClick="backToMenu()">< Back</button>
      <canvas id="easelcan" width="1200" height="800"></canvas>
    </div>
  </div>
  
  <div id="info_screen">
    <div id="title">
      <h1>Assignment 1</h1>
      <button id="close_btn" onClick="hideInfo()">Close &#120;</button>
    </div>
    <p>By: Mauro Sousa, 08013495</p>

    <p>Controls:</p>
    <p>Right/ Left Arrow Keys - Move</p>
    <p>Up Arrow - Jump</p>
  </div>
  
  <script>
    // Set the paused variable based on PHP login status
    var paused = <?php echo json_encode($handler->status != 'Logged in'); ?>; // If not logged in, paused is true

    function startGame() {
      document.getElementById('game_content').style.display = 'block';
      document.getElementById('screen_content').style.display = 'none';
      paused = false; // Allow the game to start
    }

    function backToMenu() {
      document.getElementById('game_content').style.display = 'none';
      document.getElementById('screen_content').style.display = 'block';
      paused = true; // Pause the game
    }

    function showInfo() {
      document.getElementById('screen_content').style.display = 'none';
      document.getElementById('info_screen').style.display = 'flex';
    }

    function hideInfo() {
      document.getElementById('info_screen').style.display = 'none';
      document.getElementById('screen_content').style.display = 'block';
    }
  </script>
  <script src="./main.js"></script>
</body>
</html>
