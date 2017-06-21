$(document).ready(function(){
    
    var ws = new WebSocket("ws://localhost:8100");  
    var dictionary = {};  
    var jsonLog = [];
    //------//
    var lineContainer = $("#content_pretest .line_container");
    var testPoppin = $("#content_pretest .test_poppin");
    var canvasJauge = $(".canvas_jauge");
    var joystickTop = $("#jauge_joystick_vertical_top .jauge_remplissage");
    var joystickBot = $("#jauge_joystick_vertical_bot .jauge_remplissage");
    var joystickLeft = $("#jauge_joystick_horizontal_left .jauge_remplissage");
    var joystickRight = $("#jauge_joystick_horizontal_right .jauge_remplissage");
    //------//    
    var userSSO = "";
    var partNumber = "";
    var serialNumber = "";
    var family_id;
    var sequences = "";
    var familyName = "";
    
   //Definition des variables globales pour le test final    
    var nameFinalContainer = $("#testfinal_container .name_test_container");
    var symbolNameFinal = $("#testfinal_container #symbol_name_t");
    var descriptionFinal = $("#testfinal_container #description_t");
    var imgFinal = $("#testfinal_container .img_t img");
    var imgFinalBloc = $("#testfinal_container .img_t");
    var timerBloc = $("#testfinal_container .timer_bloc");
    var stopTestBloc = $("#testfinal_container .stop_test_bloc");
    var recapListFinal = $("#testfinal_container #recap_list_t .content_recap");
    var progressBarFinal = $("#testfinal_container #progress_bar_t .percent");
    var progressBarFinalInside = $("#testfinal_container #progress_bar_t .inside_bar");
    //----//
    var finalTestEntries = {}; 
    
    var waitingAction;
    var waitingPressValue;
    var waitingReleaseValue;
    var waitingValue;
    
    var indexFinal;
    var maxIndexFinal;
    var intervalGlobal;    
    var currSymbol_name;
    var currType;
    var currDescription;
    var currPhoto_link;
    var currTimer;
    
    var spyBox = $("#dialog-spybox .content_line");
    var spyBoxDialog = $("#dialog-spybox");
    var lastSpyMsg;
    var operatorID;
    var operatorData;
    
    var isFilter;
    var filterID;
    var filterData;
    
    //-----------------------------------------------------//
    
    var _MODE = "PRETEST";
    
    //recupération des infos tsui homepage
    $("#send_info_hp").on('click', function(){
        userSSO = ($("#user_sso_input").val());
        partNumber = ($("#part_number_input").val());
        serialNumber = ($("#serial_number_input").val());        
        if(userSSO !== "" && partNumber !== "" && serialNumber !== ""){
            $.ajax({
            url : 'php/api.php?function=get_tsui&param1='+partNumber,
            type : 'GET',
            dataType : 'JSON',
            success: function(data, statut){
                if(data.length == 0){
                    alert("No result found with this part number.")
                }else{
                    familyName = data[0].name;
                    var photo = data[0].photo_link;
                    sequences = data[0].linked_sequence;
                    family_id = data[0].family;                    
                    $(".photo_tsui").attr('src', 'images/'+photo);
                    $(".title_bloc.name").html(familyName);                    
                    $(".sso_user").html(userSSO);
                    $(".part_number").html(partNumber);
                    $(".serial_number").html(serialNumber);                    
                    $("#content_home .information").removeClass("hidden");
                    $(".head_userinfo").removeClass("hidden");
                    $(".head_userinfo .info .role_user").html("Repair");
                }    
                //Recupération du dictionnaire correspondant
                $.ajax({
                    url : 'php/api.php?function=get_dictionaries_by_id&param1='+family_id,
                    type : 'GET',
                    dataType : 'JSON',
                    success: function(data, statut){
                        dictionary = data;                
                        var len = data.length;
                        lineContainer.empty();
                        for (var iter = 0; iter < len; iter++) {
                            if(data[iter].type !== "led" && data[iter].type !== "buzzer"){
                                lineContainer.append("<div class='line id"+data[iter].id+"' data-id='"+data[iter].id+"' data-name='"+data[iter].symbol_name+"' data-function='"+data[iter].type+"'><span class='td'>"+data[iter].symbol_name+"</span><span class='td'>"+data[iter].type+"</span><span class='td'>"+data[iter].description+"</span><span class='td press'>"+data[iter].pressed_val_freq+"</span><span class='td rel'>"+data[iter].released_val_freq+"</span><span class='td photo_piece'><img src='images/"+data[iter].photo_link+"'></span><span class='td totest'>Not tested</span></div>");
                            }else{
                                lineContainer.append("<div class='line id"+data[iter].id+"' data-id='"+data[iter].id+"' data-name='"+data[iter].symbol_name+"' data-function='"+data[iter].type+"'><span class='td'>"+data[iter].symbol_name+"</span><span class='td'>"+data[iter].type+"</span><span class='td'>"+data[iter].description+"</span><span class='td press'>"+data[iter].pressed_val_freq+"</span><span class='td rel'>"+data[iter].released_val_freq+"</span><span class='td photo_piece'><img src='images/"+data[iter].photo_link+"'></span><span class='td test_bt' data-name='"+data[iter].description+"' data-press='"+data[iter].pressed_val_freq+"' data-release='"+data[iter].released_val_freq+"' data-canid='"+data[iter].can_id+"'>TEST</span></div>");
                            }
                        }
                        //gestion des boutons de test des leds et buzzers
                        $(".test_bt").on('click',function(){    
                            var _this = $(this);
                            var description = $(this).data('name');
                            var press = $(this).data('press');
                            var release = $(this).data('release');
                            var canId = $(this).data('canid');        
                            var dlc = "0"+(press.toString().length/2)+"0000";
                            var signalStart = "002400806d68d7551407f09b861e3aad000549a844"+dlc+canId+press;
                            var signalStop = "002400806d68d7551407f09b861e3aad000549a844"+dlc+canId+release;
                            
                            testPoppin.html("<div class='title'>"+description+"</div><div class='bt_test'><div class='bouton_grey start_bt'>Start</div><div class='bouton_grey stop_bt'>Stop</div></div><div class='result_test'>Did something happen as expected ?</div><div class='bt_test_result'><div class='bouton_grey yes_bt'>YES</div><div class='bouton_grey no_bt'>NO</div></div>");
                            
                            testPoppin.find(".title").html(description);        
                            testPoppin.removeClass("hidden");

                            testPoppin.find(".start_bt").on('click', function(){                       
                                sendSignal(signalStart);                                
                            });
                            testPoppin.find(".stop_bt").on('click', function(){                       
                                sendSignal(signalStop);
                            });
                            testPoppin.find(".yes_bt").on('click', function(){  
                                testPoppin.empty();
                                testPoppin.addClass("hidden");
                                _this.css('background-color','yellowgreen');
                                _this.html('TEST OK');
                                _this.parent().addClass("tested");
                                _this.parent().addClass("testok");
                            });
                            testPoppin.find(".no_bt").on('click', function(){   
                                testPoppin.empty();
                                testPoppin.addClass("hidden");
                                _this.css('background-color','red');
                                _this.html('TEST FAIL');
                                _this.parent().addClass("tested");
                            });
                        });
                        
                        $(".totest").on('click',function(){
                           if($(this).hasClass("tested")){
                               $(this).html("Not tested");
                               $(this).removeClass("tested");
                               $(this).parent().removeClass("tested");
                           }else{
                               $(this).html("Tested");
                               $(this).addClass("tested");
                               $(this).parent().addClass("tested");
                           }
                        });
                    }
                });        
            }
         });
        }else{
            alert("Some fields are missing");
        }        
    }); 
    
    //recupération des infos tsui homepage INGE
    $("#send_info_hp_E").on('click', function(){
        userSSO = ($("#user_sso_input_E").val());
        partNumber = ($("#part_number_input_E").val());
        serialNumber = ($("#serial_number_input_E").val());        
        if(userSSO !== "" && partNumber !== "" && serialNumber !== ""){
            $.ajax({
            url : 'php/api.php?function=get_tsui&param1='+partNumber,
            type : 'GET',
            dataType : 'JSON',
            success: function(data, statut){
                if(data.length == 0){
                    alert("No result found with this part number.")
                }else{
                    familyName = data[0].name;
                    var photo = data[0].photo_link;
                    sequences = data[0].linked_sequence;
                    family_id = data[0].family;                    
                    $(".photo_tsui").attr('src', 'images/'+photo);
                    $(".title_bloc.name").html(familyName);                    
                    $(".sso_user").html(userSSO);
                    $(".part_number").html(partNumber);
                    $(".serial_number").html(serialNumber);                    
                    $("#content_homeE .information").removeClass("hidden");
                    $(".head_userinfo").removeClass("hidden");
                    $(".head_userinfo .info .role_user").html("Engineering");
                    
                }    
                //Recupération du dictionnaire correspondant
                $.ajax({
                    url : 'php/api.php?function=get_dictionaries_by_id&param1='+family_id,
                    type : 'GET',
                    dataType : 'JSON',
                    success: function(data, statut){
                        dictionary = data;                
                        var len = data.length;
                        lineContainer.empty();
                        for (var iter = 0; iter < len; iter++) {
                            if(data[iter].type !== "led" && data[iter].type !== "buzzer"){
                                lineContainer.append("<div class='line id"+data[iter].id+"' data-id='"+data[iter].id+"' data-name='"+data[iter].symbol_name+"' data-function='"+data[iter].type+"'><span class='td'>"+data[iter].symbol_name+"</span><span class='td'>"+data[iter].type+"</span><span class='td'>"+data[iter].description+"</span><span class='td press'>"+data[iter].pressed_val_freq+"</span><span class='td rel'>"+data[iter].released_val_freq+"</span><span class='td photo_piece'><img src='images/"+data[iter].photo_link+"'></span><span class='td totest'>Not tested</span></div>");
                            }else{
                                lineContainer.append("<div class='line id"+data[iter].id+"' data-id='"+data[iter].id+"' data-name='"+data[iter].symbol_name+"' data-function='"+data[iter].type+"'><span class='td'>"+data[iter].symbol_name+"</span><span class='td'>"+data[iter].type+"</span><span class='td'>"+data[iter].description+"</span><span class='td press'>"+data[iter].pressed_val_freq+"</span><span class='td rel'>"+data[iter].released_val_freq+"</span><span class='td photo_piece'><img src='images/"+data[iter].photo_link+"'></span><span class='td test_bt' data-name='"+data[iter].description+"' data-press='"+data[iter].pressed_val_freq+"' data-release='"+data[iter].released_val_freq+"' data-canid='"+data[iter].can_id+"'>TEST</span></div>");
                            }
                        }                        
                    }
                });        
            }
         });
        }else{
            alert("Some fields are missing");
        }        
    }); 
    
    //Click on launch final test button
    $(".launch_final").on('click', function(){
        launchFinalTest();
    });
    
    //valider manuellement l'étape (dev only)
    $("#next_final_test").on('click', function(){
        nextStepFinal("ok");
    });
    
    //interrompre manuellement le test final
    $("#stop_final_test").on('click', function(){
        stopFinalTest("interrupted");
    });
   
   //Traitement des données websocket 
    ws.onmessage=function(event) {
        switch(_MODE){
            case "PRETEST":   
                var message = JSON.parse(event.data);        
                console.log(event.data);
                var canId = message.canId;
                var canData = message.canData; 
                for (var nb = 0; nb < dictionary.length; nb++) {
                    if(dictionary[nb].can_id === canId){
                        switch(dictionary[nb].type){
                            case "button":                        
                                if(dictionary[nb].pressed_val_freq === canData){
                                    lineContainer.find(".line.id"+dictionary[nb].id).addClass("pressed");
                                    lineContainer.find(".line.id"+dictionary[nb].id).addClass("tested");                                       
                                    lineContainer.find(".line.id"+dictionary[nb].id+" .totest").addClass("tested");
                                    lineContainer.find(".line.id"+dictionary[nb].id+" .totest").html("Tested");
                                }
                                if(dictionary[nb].released_val_freq === canData){
                                    lineContainer.find(".line.id"+dictionary[nb].id).addClass("released"); 
                                    lineContainer.find(".line.id"+dictionary[nb].id).addClass("tested");
                                    lineContainer.find(".line.id"+dictionary[nb].id+" .totest").addClass("tested");
                                    lineContainer.find(".line.id"+dictionary[nb].id+" .totest").html("Tested");
                                }
                                break;
                            case "filter1":
                                if(dictionary[nb].value === canData){
                                    var jsonFilter = '{"type":"filter1", "canData":"'+canData+'", "canId":"'+canId+'", "timer":"'+dictionary[nb].timer+'"}';
                                    ws.send(jsonFilter);
                                }
                                break;
//                            case "filter2":
//                                if(dictionary[nb].value === canData){
//                                    var jsonFilter = '{"type":"filter2", "canData":"'+canData+'", "canId":"'+canId+'", "timer":"'+dictionary[nb].timer+'"}';
//                                    ws.send(jsonFilter);
//                                }
//                                break;
                            case "joystick":           
                                if(canData == "000000000000"){
                                    canvasJauge.addClass("zero_state");
                                    joystickBot.css('height', '0%');
                                    joystickTop.css('height', "100%");
                                    joystickLeft.css('width', "100%");
                                    joystickRight.css('width', "0%");
                                }
                                var joy1_horizontal = canData.substring(0,2);
                                var joy1_vertical = canData.substring(2,4);
                                var joy2_horizontal = canData.substring(4,6);
                                var joy2_vertical = canData.substring(6,8);
                                var joy3_horizontal = canData.substring(8,10);
                                var joy3_vertical = canData.substring(10,12);
                                
                                if(joy1_vertical !== '00' || joy1_horizontal !== '00'){
                                    $(".intitule span").html("JOYSTICK 1");
                                    canvasJauge.removeClass("zero_state");
                                    if(joy1_vertical !== '00'){
                                        joy1_vertical = convertHexa(joy1_vertical);
                                        if(joy1_vertical<0){
                                            joystickBot.css('height', (joy1_vertical*-1)+"%");                                 
                                        }else{
                                            joystickTop.css('height', (100-joy1_vertical)+"%");
                                        }
                                    }
                                    else{
                                        joy1_horizontal = convertHexa(joy1_horizontal);
                                        if(joy1_horizontal<0){
                                            joystickLeft.css('width', (100+joy1_horizontal)+"%");
                                        }else{
                                            joystickRight.css('width', joy1_horizontal+"%");
                                        }
                                    }
                                }
                                
                                if(joy2_vertical !== '00' || joy2_horizontal !== '00'){
                                    $(".intitule span").html("JOYSTICK 2");
                                    canvasJauge.removeClass("zero_state");
                                    if(joy2_vertical !== '00'){
                                        joy2_vertical = convertHexa(joy2_vertical);
                                        if(joy2_vertical<0){
                                            joystickBot.css('height', (joy2_vertical*-1)+"%");                                 
                                        }else{
                                            joystickTop.css('height', (100-joy2_vertical)+"%");
                                        }
                                    }
                                    else{
                                        joy2_horizontal = convertHexa(joy2_horizontal);
                                        if(joy2_horizontal<0){
                                            joystickLeft.css('width', (100+joy2_horizontal)+"%");
                                        }else{
                                            joystickRight.css('width', joy2_horizontal+"%");
                                        }
                                    }
                                }
                                
                                if(joy3_vertical !== '00' || joy3_horizontal !== '00'){
                                    $(".intitule span").html("JOYSTICK 3");
                                    canvasJauge.removeClass("zero_state");
                                    if(joy3_vertical !== '00'){
                                        joy3_vertical = convertHexa(joy3_vertical);
                                        if(joy3_vertical<0){
                                            joystickBot.css('height', (joy3_vertical*-1)+"%");                                 
                                        }else{
                                            joystickTop.css('height', (100-joy3_vertical)+"%");
                                        }
                                    }
                                    else{
                                        joy3_horizontal = convertHexa(joy3_horizontal);
                                        if(joy3_horizontal<0){
                                            joystickLeft.css('width', (100+joy3_horizontal)+"%");
                                        }else{
                                            joystickRight.css('width', joy3_horizontal+"%");
                                        }
                                    }
                                }                      
                                                                
                                break;
                            default:
                                //console.log("non indentifié");
                        }
                    }
                }
                break;
            case "TEST":   
                var message = JSON.parse(event.data);        
                console.log(event.data);
                var canId = message.canId;
                var canData = message.canData; 
                break;
            case "TOOLBOX": 
                var message = JSON.parse(event.data);        
                //console.log("TOOLBOX :"+event.data);
                var canId = message.canId;
                var canData = message.canData;
                if(spyBoxDialog.hasClass("open") && !spyBoxDialog.hasClass("stop_mode")){
                    if(isFilter == 1){
                        if(operatorID == "==" && filterID !== "" && filterID == canId){
                            sendToSpy(canId, canData);
                        }
                        if(operatorID == "!=" && filterID !== "" && filterID != canId){
                            sendToSpy(canId, canData);
                        }
                        
                        if(operatorData == "==" && filterData !== "" && filterData == canData){
                            sendToSpy(canId, canData);
                        }
                        if(operatorData == "!=" && filterData !== "" && filterData != canData){
                            sendToSpy(canId, canData);
                        }
                        
                    }else{
                        sendToSpy(canId, canData);
                    }
                    
                }else{
                    console.log("not send to spy");
                }                
                break;
        }         
        
    };
    
    $(".toolbox").on('click', function(){
        _MODE = "TOOLBOX";
        alert("mode toolbox activated");
    });
    
    function sendToSpy(canId, canData){
        var d = spyBox.get(0);
        d.scrollTop = d.scrollHeight;
        if(lastSpyMsg !== canData){
            spyBox.append("<div class='line_spy'><span class='can_id_spy' data-id='"+canId+"'>"+canId+"</span> <span class='can_data_spy'>"+canData+"</span> <span class='nb'>1</span><span class='ts'>"+new Date().getTime()+"</span></div>");
        }else{           
            var nb = $("#dialog-spybox .content_line .line_spy:last-child .nb").html();
            nb = parseInt(nb);
            nb ++;
            $(".content_line .line_spy:last-child .nb").html(nb);
        }               
        lastSpyMsg = canData;
    };
    
    $("#dialog-spybox .spy_stop").on('click',function(){        
        spyBoxDialog.addClass("stop_mode");
    });
    $("#dialog-spybox .spy_play").on('click',function(){
        spyBoxDialog.removeClass("stop_mode");
    });
    $("#dialog-spybox .spy_clear").on('click',function(){
        spyBox.empty();
    });
   
    $("#dialog-spybox .is_different_canid").on('click',function(){
        if($(this).hasClass("activated")){
            $(this).removeClass("activated");
        }else{
            $(this).addClass("activated");
        }
    });
    $("#dialog-spybox .is_different_candata").on('click',function(){
        if($(this).hasClass("activated")){
            $(this).removeClass("activated");
        }else{
            $(this).addClass("activated");
        }
    });
    
     $("#dialog-spybox .launch_filter").on('click',function(){
       var inputCanid =  $(".filter_canid").val();
       var inputCandata =  $(".filter_candata").val();
       operatorID = "==";
       operatorData = "==";
       
       if($(".is_different_canid").hasClass('activated')){
           operatorID = "!=";
       }
       if($(".is_different_candata").hasClass('activated')){
           operatorData = "!=";
       }
       if(inputCanid == "" && inputCandata == ""){
           $("#dialog-spybox .recap_filter").html("No filters applied");
           isFilter = 0;
       }else{           
           if(inputCandata !== "" && inputCanid !== ""){
               $("#dialog-spybox .recap_filter").html("CAN ID "+operatorID+" "+inputCanid+" && CAN DATA "+operatorData+" "+inputCandata+".");
               filterID = inputCanid;
               filterData = inputCandata;
           }
           if(inputCandata !== "" && inputCanid == ""){
               $("#dialog-spybox .recap_filter").html("CAN DATA "+operatorData+" "+inputCandata+".");
               filterID = "";
               filterData = inputCandata;
           }
           if(inputCandata == "" && inputCanid !== ""){
               $("#dialog-spybox .recap_filter").html("CAN ID "+operatorID+" "+inputCanid+".");
               filterID = inputCanid;
               filterData = "";
           }
           isFilter = 1;
       }
      
    });
    
    
    
    //Generation du tableau de log qui sera ensuite save en base de donnée
    function generateJsonLog(){
        jsonLog = [];
        var name;
        var fct;
        var completeName;
        $("#content_pretest .line_container .line").each(function(){
            if($(this).hasClass("tested")){
                name = $(this).data('name');
                fct = $(this).data('function');
                if(fct == "button"){
                    if($(this).hasClass("pressed")){
                        completeName = name+" - press"; 
                        jsonLog.push({name:completeName, test:'OK', fct:fct});
                    }else{
                        completeName = name+" - press"; 
                        jsonLog.push({name:completeName, test:'FAILED', fct:fct});
                    }
                    if($(this).hasClass("released")){
                        completeName = name+" - release"; 
                        jsonLog.push({name:completeName, test:'OK', fct:fct});
                    }else{
                        completeName = name+" - release"; 
                        jsonLog.push({name:completeName, test:'FAILED', fct:fct});
                    }                     
                }else{
                    if($(this).hasClass("testok")){
                        completeName = name+" - "+fct; 
                        jsonLog.push({name:completeName, test:'OK', fct:fct});
                    }else{
                        completeName = name+" - "+fct; 
                        jsonLog.push({name:completeName, test:'FAILED', fct:fct});
                    }
                }                 
            }else{
                name = $(this).data('name');
                fct = $(this).data('function');
                if(fct == "button"){
                    completeName = name+" - press"; 
                    jsonLog.push({name:completeName, test:'untested', fct:fct});
                    completeName = name+" - release"; 
                    jsonLog.push({name:completeName, test:'untested',fct:fct});
                }else{
                    completeName = name+" - "+fct; 
                    jsonLog.push({name:completeName, test:'untested',fct:fct});
                }                                
            }
        });
        console.log(jsonLog);
        console.log("------");
        jsonLog = JSON.stringify(jsonLog);
        console.log(jsonLog);
        $.ajax({
            type: "POST",
            url: "php/api.php?function=save_log_pretest",
            data: {jsonlog:jsonLog},
            success: function (msg) {
                alert("Your log have been saved.");
                $("#print_log").removeClass("hidden");
            }
        });
    };
    
    //Generation du rapport de test et affichage de la fenetre d'impression 
    function printJsonLog(jsonLog){  
        var msg = JSON.parse(jsonLog);
        var lineButton = "";
        var lineLed = "";
        var lineJoystick = "";
        var lineBuzzer = "";
        for(var i =0; i<msg.length; i++){
            if(msg[i].fct == "button"){
                if(msg[i].test == "untested"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:orange'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "OK"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:green'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "FAILED"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:red'>"+msg[i].test+"</span></div>"                
                }
                
                lineButton += line;
            }
            if(msg[i].fct == "led"){
                if(msg[i].test == "untested"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:orange'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "OK"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:green'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "FAILED"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:red'>"+msg[i].test+"</span></div>"                
                }
                lineLed += line;
            }
            if(msg[i].fct == "buzzer"){
                if(msg[i].test == "untested"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:orange'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "OK"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:green'>"+msg[i].test+"</span></div>"                
                }
                if(msg[i].test == "FAILED"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:red'>"+msg[i].test+"</span></div>"                
                }
                lineBuzzer += line;
            }
            if(msg[i].fct == "joystick"){
                if(msg[i].test == "untested"){
                    var line = "<div><span style='width:100px;display:inline-block;'>"+msg[i].name+"</span> = <span style='color:orange'>"+msg[i].test+"</span></div>"                
                }
                lineJoystick += line;
            }
            
        }
        var currentdate = new Date(); 
        var datetime =  currentdate.getDate() + "/"+ (currentdate.getMonth()+1)  + "/" + currentdate.getFullYear() + " "+ currentdate.getHours() + "h" + currentdate.getMinutes();
        var myWindow=window.open('','','width=1000,height=800');
        myWindow.document.write("<h2>PRETEST LOG RECORD - "+datetime+"</h2><div style='border:1px solid black;padding:5px;'><b>Family</b> : "+familyName+" - <b>PN</b> : "+partNumber+" - <b>SN</b> : "+serialNumber+" - <b>Firmware version</b> : 2.0.3 - <b>User SSO</b> : "+userSSO+"</div><h3>BUTTONS</h3><div>"+lineButton+"</div><h3>BUZZERS</h3><div>"+lineBuzzer+"</div><h3>BACKLIGHTS</h3><div>"+lineLed+"</div>");
        myWindow.document.close();
        myWindow.focus();
        myWindow.print();
        myWindow.close();
    };
    
    //recuperation des entrées du test final dans le dictionnaire associé
    function getFinalTest(){
        $.ajax({
                url : 'php/api.php?function=get_final_test&param1='+family_id,
                type : 'GET',
                dataType : 'JSON',
                success: function(data, statut){
                    finalTestEntries = data;
                    
                }
            }
        );
    };
    
    //Launch final test
    function launchFinalTest(){
        indexFinal = 0;
        _MODE = "TEST";
        getFinalTest();
        
        setTimeout(function(){
            maxIndexFinal = finalTestEntries.length;
            if(maxIndexFinal > 0){
                $("#testfinal_container .display_test_content").removeClass("hidden");
                $("#testfinal_container #launch_final_test").addClass("hidden");
                nameFinalContainer.removeClass("hidden");
                timerBloc.removeClass("hidden");
                imgFinalBloc.removeClass("hidden");
                stopTestBloc.addClass("hidden");
                $("#stop_final_test").removeClass("hidden");
                $("#next_final_test").removeClass("hidden");
                recapListFinal.empty();
                timerBloc.html("");
                
                displayFinalTest(indexFinal);
            }            
        },200);
    }
    
    //Affichage du test final en cours
    function displayFinalTest(indexFinal){
        var pourcentage = Math.round((indexFinal/maxIndexFinal)*100);
        
        currSymbol_name = finalTestEntries[indexFinal].symbol_name;
        currType = finalTestEntries[indexFinal].type;
        currDescription = finalTestEntries[indexFinal].description;
        currPhoto_link = finalTestEntries[indexFinal].photo_link;
        currTimer = finalTestEntries[indexFinal].timer;
        
        launchTimer(currTimer);
        
        var value = finalTestEntries[indexFinal].value;
        var can_id = finalTestEntries[indexFinal].can_id;
        var pressed_val_freq = finalTestEntries[indexFinal].pressed_val_freq;
        var pressed_val_tens = finalTestEntries[indexFinal].pressed_val_tens;
        var released_val_freq = finalTestEntries[indexFinal].released_val_freq;
        var released_val_tens = finalTestEntries[indexFinal].released_val_tens;
        
        switch(currType){
            case "button":
                symbolNameFinal.html("Press and release "+currSymbol_name);
                descriptionFinal.html(currDescription);
                imgFinal.attr('src', 'images/'+currPhoto_link);
                progressBarFinalInside.css('width',pourcentage+'%');
                progressBarFinal.html(pourcentage+'%');
                break;
            case "joystick":
                break;
        }
        
    };
    
    //goto Next step with result in param
    function nextStepFinal(result){
        indexFinal++;
        timerBloc.html("");
        clearInterval(intervalGlobal);
        if(result == "ok"){
            var line = "<div class='line'><span class='symbol'>"+currSymbol_name+"</span> - <span class='description'>"+currDescription+"</span><span class='type'>"+currType+"</span><span class='green'>TEST OK</span></div>"
        }else{
            var line = "<div class='line'><span class='symbol'>"+currSymbol_name+"</span> - <span class='description'>"+currDescription+"</span><span class='type'>"+currType+"</span><span class='red'>TEST FAIL</span></div>"
        }
        recapListFinal.append(line);
        var d = recapListFinal.get(0);
        d.scrollTop = d.scrollHeight;
        if(indexFinal< maxIndexFinal){
            displayFinalTest(indexFinal);
        }else{
            stopFinalTest("end");
        }
    }
    
    //Gestion du timer
    function launchTimer(timer){
        var time = timer*1000;
        intervalGlobal = setInterval(function(){ 
            if(timer == 0){
                nextStepFinal("fail");                
            }else{
                timerBloc.html(timer);
                timer -= 1;
            }            
        }, 1000);
    };
    
    //Interrupt or end Final test
    function stopFinalTest(result){
        switch(result){
            case "interrupted":
                $(".stop_test_bloc .result_title").html("Final test has been interrupted");
                clearInterval(intervalGlobal);
                break;
            case "end":
                var pourcentage = 100;
                progressBarFinalInside.css('width',pourcentage+'%');
                progressBarFinal.html(pourcentage+'%');
                $(".stop_test_bloc .result_title").html("Final test is completed");
                break;
        }        
        nameFinalContainer.addClass("hidden");
        timerBloc.addClass("hidden");
        imgFinalBloc.addClass("hidden");
        stopTestBloc.removeClass("hidden");
        $("#stop_final_test").addClass("hidden");
        $("#next_final_test").addClass("hidden");
        
        _MODE = "PRETEST";
    }
    
    
    //différentes fonctions d'envoi de signaux au tsui
    $("#start_node").on('click', function(){sendSignal("002400806d68d7551407f09b861e3aad000549a84402000000000000012D000000000000");});    
    $("#stop_node").on('click', function(){sendSignal("002400806d68d7551407f09b861e3aad000549a84402000000000000022D000000000000");});
    $("#start_led").on('click', function(){sendSignal("002400806d68d7551407f09b861e3aad000549a84408000000000328FFFFFFFFFFFFFFFF");});
    $("#stop_led").on('click', function(){sendSignal("002400806d68d7551407f09b861e3aad000549a844080000000003280000000000000000");});
    $("#record_log").on('click', function(){generateJsonLog();});
    $("#print_log").on('click', function(){printJsonLog(jsonLog);});
    
    function sendSignal(signal){        
        var jsonData = '{"type":"signal", "msg":"'+signal+'"}';
        console.log(jsonData);
        ws.send(jsonData);
    }
    
    function convertHexa(hexaVal){
        var newval = parseInt(hexaVal, 16);
        if(newval>0x80){
           newval = newval-0x100; 
        }
        return newval;
    }
        
});