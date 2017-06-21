<?php

///////////////////////////////////////////////////////////////////
//connection base de donnée en PDO/////////////////////////////////
///////////////////////////////////////////////////////////////////
$VALEUR_hote='localhost';
$VALEUR_port='';
$VALEUR_nom_bd='testbench';
$VALEUR_user='root';
$VALEUR_mot_de_passe='';

$connexion = new PDO('mysql:host='.$VALEUR_hote.';port='.$VALEUR_port.';dbname='.$VALEUR_nom_bd, $VALEUR_user, $VALEUR_mot_de_passe);



///////////////////////////////////////////////////////////////////
//Recuperation des variables GET pour traitement ultérieur/////////
///////////////////////////////////////////////////////////////////
if(isset($_GET["function"])){$function = $_GET["function"];}
if(isset($_GET["param1"])){$param1 = $_GET["param1"];}
if(isset($_GET["param2"])){$param2 = $_GET["param2"];}
if(isset($_GET["param3"])){$param3 = $_GET["param3"];}
if(isset($_GET["param4"])){$param4 = $_GET["param4"];}
if(isset($_GET["param5"])){$param5 = $_GET["param5"];}


///////////////////////////////////////////////////////////////////
//Catalogue de fonction ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////

//retourne les infos d'un tsui en fonction du part number
$getTsui = function ($part_number, $connexion){
    $resultats=$connexion->query("SELECT * FROM tsui WHERE part_number = '$part_number'");  
    $resultats->execute();
    $result = $resultats->fetchAll();

    return json_encode($result);
};

//retourne un dictionnaire complet en fonction d'une family id
$getDictionariesById = function ($id, $connexion){
    $resultats=$connexion->query("SELECT * FROM dictionaries WHERE family_id = $id AND type != 'filter1' AND type != 'filter2'");  
    $resultats->execute();
    $result = $resultats->fetchAll();

    return json_encode($result);
};

//retourne les elements du test final en fonction d'une family id
$getFinalTest = function ($id, $connexion){
    $resultats=$connexion->query("SELECT * FROM dictionaries WHERE family_id = $id AND is_final = '1'");  
    $resultats->execute();
    $result = $resultats->fetchAll();
    
    return json_encode($result);
};

//enregistre les log d'un pretest
$saveLogPretest = function ($connexion){
    $jsonlog = $_POST['jsonlog'];
    $user_sso = 'testuser';
    $pn = 'testPN';
    $serial = 'testSerial';
    $role = 'repair';
    $type = 'pretest';
    
    $stmt = $connexion->prepare("INSERT INTO global_log (json_log, part_number, serial_number, user_sso, role, type, date) VALUES (:jsonlog, :partnumber, :serialnumber, :user_sso, :role, :type, NOW())");
    $stmt->bindParam(':jsonlog', $jsonlog);
    $stmt->bindParam(':partnumber', $pn);
    $stmt->bindParam(':serialnumber', $serial);
    $stmt->bindParam(':user_sso', $user_sso);
    $stmt->bindParam(':role', $role);
    $stmt->bindParam(':type', $type);
    
    $stmt->execute();
    
    
};
 
///////////////////////////////////////////////////////////////////
//Routeur des fonctions appelées en ajax via des param get en url//
///////////////////////////////////////////////////////////////////
if(isset($_GET["function"])){
    switch ($function) {
        case "get_tsui":
            echo $getTsui($param1, $connexion);
            break;    
        case "get_dictionaries_by_id":
            echo $getDictionariesById($param1, $connexion);
            break;    
        case "save_log_pretest":
            $saveLogPretest($connexion);
            break;    
        case "get_final_test":
            echo $getFinalTest($param1, $connexion);
            break;    
        default:
            echo "no param";
    }
}


