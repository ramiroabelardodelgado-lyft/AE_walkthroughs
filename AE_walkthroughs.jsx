/* ======================================================================================
V.018b
              EDU NLA Figma to AE UI Walkthrough 

=========================================================================================

2024  Ramiro Delgado ( Lyft Educational Content)

======================================================================================= */

var window = new Window("palette","test",undefined);
var stepN = 0;
var folder = new Folder;
var myJson;
folder = folder.selectDlg("Please select the exported Figma folder");
instanceFolder = "edu-instances";
instanceFolder = app.project.items.addFolder(instanceFolder);
var ratio = 1290/393;
var ui = {
    width:(ratio*393),
    height:(ratio*852)
};

/* ======================================================================================
                                    UTILITY FNs
======================================================================================= */

String.prototype.endsWith = function( str ) {
    return this.substring( this.length - str.length, this.length ) === str;
};
function roundFd(myFloat){
    myFloat = parseFloat(myFloat);
    newFloat = myFloat.toFixed(1);
    return newFloat;
};

function check_filetypes(files){
    var element;
    var my_files = [];
    var myJson ;
    for (var i = 0; i < files.length; i++) {
        element = files[i];
        if(element.name.endsWith(".png")){
            my_files.push(element);
        }else if(element.name.endsWith(".json")){
            myJson = element;
        }
    };
    my_files = my_files.sort();
    return [my_files,myJson];    
};
function readNparse(jsonFile){
    var file = new File(jsonFile);
    file.open('r');
    var json = file.read();
    json = JSON.parse(json);
    return json;
};
function makeParent(thisComp,parent){
    for (var n = 0; n < thisComp.layers.length; n++) {
        thisLayer = thisComp.layers[n+1];
        //SKIP SELF
        if(parent.name != thisLayer.name){
            thisLayer.setParentWithJump(parent)
            //thisLayer.parent = parent
        };       
    };
};
function offset_Others(thisComp,layer,timeOffset){
    for (var n = 0; n < thisComp.layers.length; n++) {
        thisLayer = thisComp.layers[n+1];
        //SKIP SELF
        if(layer.name != thisLayer.name){
            if(thisLayer.name.indexOf('EDU')>-1){
                thisLayer.startTime = thisLayer.inPoint + timeOffset;    
            }else if(thisLayer.name.indexOf('png')){
                //SKIP PNGS
            };
        };
    };
};
function fixpngEnd(thisComp){
    for (var n = 0; n < thisComp.layers.length; n++) {
        thisLayer = thisComp.layers[n+1];
        if(thisLayer.name.indexOf('png')){
            thisLayer.outPoint = thisComp.duration;
        }
    };

};
function fixName(name){
    newname = name.replace('* ','');
    return newname;
};
function adj_outPoint(composition) {
    for(var i = 1; i <= composition.layers.length ;i++) {
       // alert(composition.layer(i).name)//
        composition.layer(i).outPoint = composition.duration;

    }
};
function addBGLayer(miniComp) {
    var shapeLayer = miniComp.layers.addShape();
    shapeLayer.name = 'BG_' + miniComp.name;
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    var shapeRect = contents.addProperty("ADBE Vector Shape - Rect");
    shapeRect.property('ADBE Vector Rect Size').setValue([miniComp.width, miniComp.height]);
    shapeRect.property("ADBE Vector Rect Position").setValue([(miniComp.width * .5), (miniComp.height * .5)]);
    setPosition(shapeLayer, 0, 0);
    var shapeFill = contents.addProperty("ADBE Vector Graphic - Fill");
    shapeFill.property('ADBE Vector Fill Color').setValue([255,255,255]);
    return shapeLayer;
};
/* ======================================================================================
                                    ANIM FNs
======================================================================================= */
function fadeIn(layer,duration,initial,maxValue){
    var lastF = initial+duration;
    layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(initial,0);
    layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(lastF,maxValue);
};
function fadeOut(layer,duration,last,maxValue){
    var firstF = last-duration;
    layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(firstF,maxValue);
    layer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(last,0);
};
function timeOffset(layer, time){
    layer.startTime = time;
};
function setAnchor(Layer,x,y){
    Layer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([x,y]);
};
function setPosition(Layer,x,y){
    Layer.property("ADBE Transform Group").property("ADBE Position").setValue([x,y]);
};
function setBezier(property){
    for( var n = 0; n < property.numKeys; n++ ){
        property.setInterpolationTypeAtKey(n+1,KeyframeInterpolationType.BEZIER,KeyframeInterpolationType.BEZIER);
    }
};
function setEaseEase(property){
    //var easeIn = new KeyframeEase(0.5, 50);
    //var easeOut = new KeyframeEase(0.75, 85);
    var easeIn = new KeyframeEase(0,70);
    var easeOut = new KeyframeEase(0, 70);

    for( var n = 0; n < property.numKeys; n++ ){
        property.setTemporalEaseAtKey(n+1, [easeIn],[easeOut]);
    }
   
};
/* 
function createRect(layer){
    var contents = layer.property("ADBE Root Vectors Group");
    var shapeRect = contents.addProperty("ADBE Vector Shape - Rect");
    shapeRect.property('ADBE Vector Rect Size').setValue([width,height]);
    return contents,ShapeRect;

};
 */          
/* ======================================================================================
                                    MAIN FNs
======================================================================================= */
function json_UI(ui_array,miniComp) {

    srcClick = app.project.item(3);
    srcStep = app.project.item(4);
    srcSwipe = app.project.item(5);

    var compW = miniComp.width;
    var compH = miniComp.height;

    thisSteps = 0;
    var fSteps = [];


    var uia_name;
    var j_data_C;
    var frameHeight;
    var frameWidth;
    uia_name = ui_array.name;

    //IF EDU UI ASSETS FOR THIS IMAGE
    if (uia_name != undefined) {
        j_data_C = ui_array.data;
        posScale = ratio;

        frameWidth = ui_array.o_width;
        frameHeight = ui_array.o_height;
        
        if(frameWidth == 1290){
            posScale = 1;
        }


        frame = miniComp;
        frameDuration = frame.duration;

        myDuration = 0;
        var clickStart_offset = 2.25;

        offsetme = false;
        var scrolls = false;
        
        //IF ASSET HAS DATA
        if (j_data_C != undefined) {
            var lstackC = 0;
            var lstackS = 0;
            var lstackSW = 0;
            var lstackSC = 0;
            var lstack =0;
            var highlightStack = 0;
            var highlightTime = 0;

            for (var n = 0; n < j_data_C.length; n++) {

                element = j_data_C[n];
                width = element.width;
                height = element.height;
                x = element.x ;
                y = element.y ;
                //Adjust Scale
                x = x * posScale;
                y = y * posScale;
                width = width * posScale;
                height = height * posScale;

                name = fixName(element.name)
                //alert(lstack + '  '+ name)


                if (name.indexOf("EDU-Step")>-1){
                    stepN++;
                    thisSteps++;
                    

                    dup = srcStep.duplicate();
                    dup.name = name+("0" + stepN);
                    dup.parentFolder = instanceFolder;

                    iLayer = frame.layers.add(dup);
                    setAnchor(iLayer,0,0);
                    setPosition(iLayer,x,y);
                    timeOffset(iLayer,.25);
                    iLayer.collapseTransformation = true;
                    fSteps.push(iLayer);
                    lstack++;
                

                }
                else if(name.indexOf("EDU-swipe")>-1){
                    sstart = .5;
                    swipedur = 1.5;
                    swipeOffset = 2.25+(2*lstack);
                    swipeLayer = frame.layers.add(srcSwipe);

                    rot = Math.round(element.rotation);

                    setAnchor(swipeLayer,0,0);
                    pos = swipeLayer.property("ADBE Transform Group").property("ADBE Position");
                    
                    if( rot == 0){
                        //HOR LtR
                        startX = x;
                        endX = x+width-srcSwipe.width;

                        pos.setValueAtTime(sstart,[startX,y]);
                        pos.setValueAtTime(swipedur,[endX,y]);

                    }else if(rot == 90){
                        var startY = y-(srcSwipe.width);
                        var endY =  y-width;

                        pos.setValueAtTime(sstart,[x,startY]);
                        pos.setValueAtTime(swipedur,[x,endY]);

                    }else if( Math.abs(rot) == 180){
                        //HOR INV RtL
                        startX = x-srcSwipe.width;
                        endX = x-width;
                        y = y-srcSwipe.width;

                        pos.setValueAtTime(sstart,[startX,y]);
                        pos.setValueAtTime(swipedur,[endX,y]);
                        
                    }else if( rot == -90){
                        //Ver
                        var endY = y+width-srcSwipe.width;
                        var startY =y;
                        x -= srcSwipe.width;

                        pos.setValueAtTime(sstart,[x,startY]);
                        pos.setValueAtTime(swipedur,[x,endY]);
                    };

                    /* 
                    
                    sw = srcSwipe.width;
                    sh = srcSwipe.width;
                    startPosX = x;
                    endPosX = width - (sw);
                    startPosY = y;
                    endPosY = height-(sh);

                    swipeLayer.collapseTransformation = true;
                    setAnchor(swipeLayer,0,0);
                    setPosition(swipeLayer,x,y);
                    pos = swipeLayer.property("ADBE Transform Group").property("ADBE Position");
                    
                    if(name.indexOf('V')>0){
                    //VERTICAL SWIPE
                        pos.setValueAtTime(sstart,[x,startPosY]);
                        pos.setValueAtTime(swipedur,[x,endPosY]); 
                        
                        //moveToBeginning()
                    }else{
                    //HORIZONTAL SWIPE
                        pos.setValueAtTime(sstart,[startPosX,y]);
                        pos.setValueAtTime(swipedur,[endPosX,y]);       
                    }     
                    */

                    
                    setEaseEase(pos);                      
                    swipeLayer.startTime = swipeOffset;

                    if(swipeLayer.outPoint > frame.duration){
                        dif = swipeLayer.outPoint-frame.duration;
                        frame.duration += dif;
                    }
                    adj_outPoint(frame);
                    lstack++;

                }
                //CREATE MASK LAYER
                else if (name.indexOf("EDU-Highlight")>-1){
                    
                    var roundness = 30;
                    highlightStack++;

                    maskedLayer = frame.layers.addSolid([0, 0, 0], 'BG_'+name, compW, compH, 1, 24);
                    
                    fadeIn(maskedLayer,.5,0,50);
                    fadeOut(maskedLayer,.5,2.25,50)
                    timeOffset(maskedLayer,.25);

                    var shapeLayer = frame.layers.addShape();
                    shapeLayer.name = name;
                    
                    maskedLayer.setTrackMatte(shapeLayer,TrackMatteType.ALPHA_INVERTED);

                    var contents = shapeLayer.property("ADBE Root Vectors Group");
                    var shapeRect = contents.addProperty("ADBE Vector Shape - Rect");
                    shapeRect.property('ADBE Vector Rect Size').setValue([width,height]);

                    //CENTER ANCHOR
                    shapeRect.property("ADBE Vector Rect Position").setValue([(width*.5),(height*.5)]);
                    setPosition(shapeLayer,x,y);
                    
                    //IF BUTTON MASK
                    if(name.indexOf("Button") >- 1){
                        roundness = 200;
                    };

                    if(highlightStack > 1){
                        highlightTime+=2.25;
                        miniComp.duration += 2.25;
                        timeOffset(maskedLayer,highlightTime+1);
                        adj_outPoint(frame);
                    };

                    shapeRect.property('ADBE Vector Rect Roundness').setValue(roundness);
                    var shapeFill = contents.addProperty("ADBE Vector Graphic - Fill");
                    
                }
                else if (name.indexOf( "EDU-click")>-1){

                    clickLayer = frame.layers.add(srcClick);
                    clickLayer.startTime = clickStart_offset;
                    clickLayer.collapseTransformation = true;

                    setPosition(clickLayer,x,y);
                    setAnchor(clickLayer,0,0);
                    lstack++;


                }
                else if (name.indexOf("EDU-scroll") > -1 ){
                    scrolls = true;
                    thiScroll = element;
                }
            };

            if( scrolls == true ){

                width = thiScroll.width;
                height = thiScroll.height;
                x = thiScroll.x ;
                y = thiScroll.y ;
                //ADJ Scale
                x = x * posScale;
                y = y * posScale;
                width = width * posScale;
                height = height * posScale;

                scroll_Layer = frame.layers.addSolid([0, 0, 0],'scroll', Math.round(width), Math.round(height), 1, 24);

                setAnchor(scroll_Layer,0,0);
                setPosition(scroll_Layer,0,0);
                
                sstart = 1;
                scrollDuration = (y / ui.height);
                
                if(
                    scrollDuration < 1 ){
                    scrollDuration = 1;
                };

                scrollDuration += sstart;
                frame.duration += scrollDuration;

                offset_Others(frame,scroll_Layer,scrollDuration);

                pos = scroll_Layer.property("ADBE Transform Group").property("ADBE Position");
                pos.setValueAtTime(sstart,[0,0]);
                pos.setValueAtTime(scrollDuration,[0,(-y)]);

                makeParent(frame,scroll_Layer);

                //INTERPOLATION & ANIM
                //setBezier(pos);
                setEaseEase(pos);
                fixpngEnd(frame);
                scroll_Layer.enabled = false;
                scrolls = false;   
                //frame.duration += thisDuration;

                
            };

                


        };
    };
};

function importFiles(files, folderName) {
    app.beginSuppressDialogs();

    // additionally you can create the folder in AE to put all your imported files into
    var folder = app.project.items.addFolder(folderName);
    var compDuration = 5*files.length;
    var miniComp_Duration = 5;
    var parentComp = app.project.items.addComp(folderName,1290,2796,1,compDuration,24)
    var imported;
    var myJson = readNparse(files[1]);
    files = files[0];
    var timePointer = 0;

    for(var i = 0; i < files.length; i++) {
        // only import it if its not a folder
        if(!files[i].name.endsWith(".png")){
            //console.log("skipping "+files[i].name);
        }else{
            if(files[i].name.indexOf(".") != -1) {

                imported = app.project.importFile(new ImportOptions(files[i]));
                mName = imported.name.split('.')[0];
    
                miniComp = app.project.items.addComp(mName,1290,imported.height,1,miniComp_Duration,24);
                // ADD WHITE BG
                addBGLayer(miniComp);
                //END WHITE BG

                myLayer = miniComp.layers.add(imported);

                setAnchor(myLayer,0,0);
                setPosition(myLayer,0,0);

                json_UI(myJson[i],miniComp);

                //miniComp_Duration = miniComp.duration;
            

                /// MARKERS ///
                var myMarker = new MarkerValue(mName);
                parentComp.markerProperty.setValueAtTime(timePointer, myMarker);

                miniCompFolder = app.project.items.addFolder(miniComp.name);
                miniCompFolder.parentFolder = folder;
    
                miniComp.parentFolder = miniCompFolder;
                imported.parentFolder = miniCompFolder;
                
                nuLayer = parentComp.layers.add(miniComp);
                nuLayer.startTime = timePointer;

                setAnchor(nuLayer,0,0);
                setPosition(nuLayer,0,0);
                timePointer += miniComp.duration;

                //nuLayer.startTime = timePointer;
                //currentDuration += miniComp_Duration;

            }

        }
        
    }
    parentComp.duration = timePointer;
    instanceFolder.parentFolder = folder;
    parentComp.openInViewer();
    app.activeViewer.views[0].options.zoom=.2;

    

    
    app.endSuppressDialogs(false);


};

window.center();
window.show();

if(folder.exists) {
    var files = folder.getFiles();
    files = check_filetypes(files);
    var text1 = window.add("statictext",undefined,'Reading Files');
    importFiles(files, folder.name.replace(/%20/g, " "));
};
window.close();


//DEPR
//var file = new File;
//file = file.openDlg("Select EDU json");
//file.open('r');
//var arre = file.read();
//arre = JSON.parse(arre);
//arre = arre.sort();
//file.close();
//console.log(arre);
//var text1 = window.add("statictext",undefined,arre[0].name);
//myJson = arre.array.forEach((name,data) => result[name] = data );
/*
DEPR
function iterate(myData){
    for (element in myData){
        alert(element)
    };

}; 
*/
    
// FOR REF
//dup = srcStep.duplicate();
//dup.name = "newClone";
//instanceFolder = "edu-instances";
//instanceFolder = app.project.items.addFolder(instanceFolder);
//dup.parentFolder = instanceFolder;


//CHANGELOG
//AE JSX
// v.016 added two swipe/slide animations, one component for horizontal and one for vertical  
// v.017 Added swipe support using just one component rotated, (this adds two extra swipe possibilities)
// v.017b fixed a bug on swipe animation component (-180 deg), Figma sometimes rotates as 180 or -180, so changed to read the abs value of rotation when its 180;

//FIGMA
// v.013
// ADDED ZIP FILE SUPPORT
// plugin now after the export it automatically shows up the EDU comopnents that were turn off during export.
//v.014 


