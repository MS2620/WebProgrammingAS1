<!DOCTYPE html>
<head>
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
    #b2dcan {
      background-color: #000;
    }
    /* #easelcan {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
    } */
    /* #viewport {
      position: relative;
      z-index: 1;
      margin: 0;
      padding: 0;
      width: 600px;
      height: 400px;
      border: none;
      overflow: hidden;
    } */
  </style>
</head>

<body>
  <h1>Assignment 1</h1>
  <?php

    if($handler->status == 'Logged out' || $handler->status == null){
      echo $handler->generateLoginText();
    } else {
      echo $handler->generateLogout();
    }

    if($handler->status == 'Logged in'){
      echo '<p>Logged in as '.$handler->providerInstance->getName().'</p>';
      echo '<img src="'.$handler->providerInstance->getAvatar().'" />';
    }

  ?>
  <div id="viewport">
    <canvas id="easelcan" width="1200" height="800"></canvas>
  </div>
  <canvas id="b2dcan" width="1200" height="800"></canvas>
  <script src="./main.js"></script>
</body>
