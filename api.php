<?php
/**
 * Created by PhpStorm.
 * User: uadn-gav
 * Date: 1/3/17
 * Time: 11:02 AM
 */
error_reporting(65535);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
//todo: save files with userData in *.txt in backupuserdata one time per day
//todo: save backup of this data on cloud on home pc

class DateManager{
    public static function getCurrentTimeStringSQL() {
        //timeTemplate = '20000213085645';
        $day = date('d');
        $month = date('m');
        $year = date('o');
        $hours = date('H');
        $minutes = date('i');
        $seconds = date('s');
        return "$year$month$day$hours$minutes$seconds";
    }

    public static function getTimestampFromSQLString($string) {
        $date = new DateTime($string);
        return $date->getTimestamp();
    }
}

class DataManager{

    public $db;
    public $tableName = 'main';
    public $newUserData;

    public function __construct($newUserData = '')
    {
        $this->newUserData = $newUserData;
        $this->dbConnect();
    }


    private function dbConnect() {
        $dbConfig = [
            'host' => '127.0.0.1',
            'username' => 'root',
            'password' => 'basta',
            'database' => 'learnwords'
        ];

        //temporary table for test is template_sms_sent
        //message = user data json
        //template_sms_sent_id - auto increment
        //sender 'bi' = mb later make it userName
        //mobile = random useless number(mb password)
        //created  - date of creation

        $this->db = new PDO(
            "mysql:host=" . $dbConfig['host'] . ";dbname=" . $dbConfig['database'] . ";charset=utf8",
            $dbConfig['username'],
            $dbConfig['password'],
            [PDO::MYSQL_ATTR_FOUND_ROWS => TRUE]
        );
        $this->db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING );
    }

    private function checkValidJson($data) {
        json_decode($data);
        if (json_last_error() === JSON_ERROR_NONE) {
            return true;
        }
        return false;
    }


    public function updateUserData() {
        if ($this->checkValidJson($this->newUserData) === false) {
            sendError('json is invalid');
        };
        $userData = str_split($this->newUserData, 30000);
        $oldUserData = $this->getOldUserData();
        if ($oldUserData === NULL) {
            $this->saveUserData($userData);
            die('data is saved');
        }
        $lastSavedTime = DateManager::getTimestampFromSQLString($oldUserData['lastTime']);
        $currentTime = time();
        if (($currentTime-$lastSavedTime)>3*60*60) {
            //if difference more than day then save new userData
            $this->saveUserData($userData);
            die('data is saved');
        }
        sendError('too early to save');
    }

    private function saveUserData(array $userDataJson) {
        //divide on multiple part userData before
        $time = DateManager::getCurrentTimeStringSQL();
        $queue = "INSERT INTO $this->tableName (dataId, userName, data, created) VALUES";
        $userDataQueue = array_map(function ($userDataPart) use ($time) {
            return " (null, 'bista', '$userDataPart', $time)";
        }, $userDataJson);
        $queue .= implode(',', $userDataQueue);
        $statement = $this->db->prepare($queue);
        $statement->execute();
    }

    public function getOldUserData() {
        $lastSaveTime = $this->retrieveLastSaveTimeOfUserData();
        if ($lastSaveTime === NULL) return NULL;
        $que = $this->db->prepare("SELECT data FROM $this->tableName WHERE userName='bista' AND created='$lastSaveTime'");
        $que->execute();
        $data = $que->fetchAll(PDO::FETCH_ASSOC);
        $data = array_map(function ($rowNumber) {
            return $rowNumber['data'];
        }, $data);
        return [
            'data'=> implode('', $data),
            'lastTime' => $lastSaveTime
        ];
    }

    private function retrieveLastSaveTimeOfUserData() {
        //return [latest] => 2017-01-05 15:41:20
        $que = $this->db->prepare("SELECT MAX(created) AS latest FROM $this->tableName WHERE userName='bista'");
        $que->execute();
        $data = $que->fetch(PDO::FETCH_ASSOC);
        return $data['latest'];
    }
}

function sendError($message) {
    http_response_code(500);
    die($message);
}


if (isset($_POST['save']) && isset($_POST['userData'])) {

//    echo 'all fine';


    $userData = $_POST['userData'];
    $dataManager = new DataManager($userData);
    $dataManager->updateUserData();
} else if (isset($_POST['retrieve'])) {
    //get data
    $dataManger = new DataManager();
    $oldData = $dataManger->getOldUserData();
    if ($oldData === NULL) {
        sendError('nothing stored in db');
    } else {
        print_r($oldData['data']);
    }
} else {
    sendError('not save and not retrieve');
}

//todo: make backup copies from db to cloud in txtfile (mb every day)
//todo: no error when db config is incorrect (a.k.a. saved when it's should be error)