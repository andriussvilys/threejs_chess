
  let bezierSegments = 10;

  const dotRadius = 4;

  var x = [ 250, 255];
  var y = [50, 450];

  let bezierCurves = []

  let bezierCurveIndeces = []

  let mousedown = false;

  var selectedIndex_dot = -1;
  let selectedIndex_line = -1;

  function draw() {

    
  const image_input = document.querySelector("#image-input");
  const canvas = document.getElementById('canvas');
  const canvas_container = document.getElementById("container_canvas");


  image_input.addEventListener("change", function() {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const uploaded_image = reader.result;
      document.querySelector("#container_canvas").style.backgroundImage = `url(${uploaded_image})`;
    });
    reader.readAsDataURL(this.files[0]);
  });


  if (canvas.getContext) {
    var ctx = canvas.getContext("2d");

  // image
  var imageObj = new Image();
  imageObj.src = 'chess_2.png'; 
        
  // Draw
  redraw();
  // key events
  window.addEventListener('keydown', function(evt) {

        var key=evt.keyCode;

      switch(key) {

        case 88: // x

        curvesToLines()
        redraw()

        break;

        case 46: // delete
          if(selectedIndex_dot > -1){
            if( !deleteBezierPoint(selectedIndex_dot) ){
              x.splice(selectedIndex_dot, 1)
              y.splice(selectedIndex_dot, 1)
              bezierCurveIndeces = bezierCurveIndeces.map( elem => {
                if(elem > selectedIndex_dot)
                  return elem -= 1
                return elem
              })
            }
            selectedIndex_dot = -1
          }
          redraw();
        break;
              
        case 13: // enter
        curvesToLines()
        redraw()
        splineEditorOutput = [x, y]


        break;
      }
      return false;
    }, false); // end key events

  canvas_container.addEventListener('click', e => {

      selectedIndex_line = checkIfIsOnALine(e.clientX, e.clientY)

      if(e.ctrlKey && selectedIndex_line > -1){
        addBezierPoints(selectedIndex_line)
      }

      if(e.altKey && selectedIndex_line > -1){
        x.splice(selectedIndex_line + 1, 0, e.clientX)
        y.splice(selectedIndex_line + 1, 0, e.clientY)
        bezierCurveIndeces = bezierCurveIndeces.map(elem => {
          if( elem > selectedIndex_line)
            return elem + 1
            
          return elem
        })
      }

      selectedIndex_dot = checkIfDot(e.clientX, e.clientY)
      if(selectedIndex_dot > -1 || selectedIndex_line > -1)
        redraw()

      
    }, false)

    //folowing events are needed to move around dots
  canvas_container.addEventListener('mousedown', e => {

    selectedIndex_dot = checkIfDot(e.clientX, e.clientY)

    mousedown = true;

    redraw()

  })

  canvas_container.addEventListener('mouseup', e => {
    mousedown = false
  })

  canvas_container.addEventListener('mousemove', e => {
    if(mousedown == true && selectedIndex_dot > -1){

      x[selectedIndex_dot] = e.clientX
      y[selectedIndex_dot] = e.clientY
      redraw()
    }
  })

  }

  function checkIfDot(coord_x, coord_y){

    let result = -1;

    for (let index = 0; index < x.length; index++) {

      const coord = x[index];

      if( coord_x >= (coord - dotRadius) && coord_x <= (coord + dotRadius) ){

        if( coord_y >= (y[index] - dotRadius) && coord_y <= (y[index] + dotRadius)){

          result = index;
          break;
        }

      }
      
    }

    return result;

  }

  function checkIfIsOnALine(coord_x, coord_y){

    let index = -1;
    //1) - find if clientX is between two x array values

    //1.1) filter out x coordinates that belong to bezier curvers
    let straightLinePoints = [];
    for (let i = 0; i < x.length; i++) {

      if( !bezierCurveIndeces.includes(i) )
        straightLinePoints.push(
          {
            value: x[i],
            index: i
          }
        )

      else
        i += 2;

    }

    for (let i = 0; i < (straightLinePoints.length); i++) {

      const elem1 = straightLinePoints[i]
      const elem2 = {value: x[elem1.index + 1], index: elem1.index + 1}

      const coord_1 = elem1.value;
      const coord_2 = elem2.value;

    //if user clicked in an area between two points in x array
      if( 
          ( coord_x >= coord_1 ) && ( coord_x <= coord_2 ) ||
          ( coord_x <= coord_1 ) && ( coord_x >= coord_2 )
        )
        {
        
        //calculate linear equation with two points
        //calculate if y value using clientX 
          y_temp = Math.round(getPointOnALine(elem1.index, elem2.index, coord_x))

        //check if clientY matches with calculated value of the linear equation
        const errorMargin = 5
          if(coord_y >= (y_temp - errorMargin) && coord_y <= ( y_temp + errorMargin)){
            return elem1.index;
          }

        }

    }

    return -1

  }


  //takes indeces from x array, an arbitrary x point
  // if x is between two values from x array, returs Y coordinate on the line between the two x array values
  function getPointOnALine(index1, index2, clientX){
    const x1 = x[index1]
    const y1 = y[index1]
    const x2 = x[index2]
    const y2 = y[index2]

    const m = ( y2 - y1 ) / ( x2 - x1 )
    const b = y2 - (m * x2)

    return m * clientX + b

  }

  function addBezierPoints(x_index){


    const x1 = x[x_index]
    const x2 = x[x_index + 1]

    let intervalLength = x2 - x1

    let newPoint_1_x = Math.round( x1 + (intervalLength/3) )
    let newPoint_2_x = Math.round( x1 + (intervalLength/3)*2 )

    let newPoint_1_y = Math.round( getPointOnALine(x_index, x_index+1, newPoint_1_x) )
    let newPoint_2_y = Math.round( getPointOnALine(x_index, x_index+1, newPoint_2_x) )

    bezierCurveIndeces = bezierCurveIndeces.map(elem => {
      if(elem > x_index)
        return elem + 2
      return elem
    })

    bezierCurveIndeces.push(x_index)
    //sort in asc order
    bezierCurveIndeces.sort( (a,b) => {return a - b} )

    //insert controls points to coordinate arrays
    x.splice(x_index + 1, 0, newPoint_1_x)
    x.splice(x_index + 2, 0, newPoint_2_x)

    y.splice(x_index + 1, 0, newPoint_1_y + 10)
    y.splice(x_index + 2, 0, newPoint_1_y + 10)

  }

  function deleteBezierPoint(x_index){

    //if bezier start point
    if(bezierCurveIndeces.includes(selectedIndex_dot)){
      bezierCurveIndeces.splice(  bezierCurveIndeces.indexOf(selectedIndex_dot), 1)
      x.splice(selectedIndex_dot + 1, 2)
      y.splice(selectedIndex_dot + 1, 2)

      bezierCurveIndeces = bezierCurveIndeces.map(elem => {
        if(elem > x_index)
          return elem - 2
        return elem
      })

      return true;
    }

    //if FIRST bezier control point
    else if( bezierCurveIndeces.includes( selectedIndex_dot - 1) ){
      bezierCurveIndeces.splice(  bezierCurveIndeces.indexOf(selectedIndex_dot - 1), 1)
      x.splice(selectedIndex_dot, 2)
      y.splice(selectedIndex_dot, 2)

      bezierCurveIndeces = bezierCurveIndeces.map(elem => {
        if(elem > x_index)
          return elem - 2
        return elem
      })

      return true;
    }

    //if SECOND bezier control point
    else if( bezierCurveIndeces.includes( selectedIndex_dot - 2) ){
      bezierCurveIndeces.splice(  bezierCurveIndeces.indexOf(selectedIndex_dot - 2), 1)
      x.splice(selectedIndex_dot - 1, 2)
      y.splice(selectedIndex_dot - 1, 2)

      bezierCurveIndeces = bezierCurveIndeces.map(elem => {
        if(elem > x_index)
          return elem - 2
        return elem
      })

      return true;
    }

    else if( bezierCurveIndeces.includes( selectedIndex_dot - 3) ){
      bezierCurveIndeces.splice(  bezierCurveIndeces.indexOf(selectedIndex_dot - 3), 1)
      x.splice(selectedIndex_dot - 2, 2)
      y.splice(selectedIndex_dot - 2, 2)

      bezierCurveIndeces = bezierCurveIndeces.map(elem => {
        if(elem > x_index)
          return elem - 2
        return elem
      })

      return true;
    }

    return false;
    
  }

  // draw border
    function drawBorder() {
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(500,0);
      ctx.lineTo(500,500);
      ctx.lineTo(0,500);
      ctx.closePath();
      ctx.stroke();
    } 

  function drawDot(x,y,radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI*2, true);
    ctx.closePath();
    ctx.fill();
  }

  // Redraw 
  function redraw() {


      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgb(0, 0, 0)"
      drawBorder();       

      // ctx.strokeStyle = "rgb(0, 255, 0)"
      for (let index = 0; index < x.length; index++) {

        ctx.beginPath()
        ctx.moveTo(x[index], y[index])

        if( !bezierCurveIndeces.includes(index) ){

          if(index == selectedIndex_line){
            ctx.lineTo(x[index + 1 ], y[index + 1 ])
            ctx.strokeStyle = "rgb(255, 0, 0)"
          }

          else{
            ctx.strokeStyle = "rgb(0, 255, 0)"
            ctx.lineTo(x[index+1],y[index+1]); 
          }

        }

        else{

          ctx.strokeStyle = "rgb(0, 255, 0)"
          ctx.bezierCurveTo(x[index + 1],y[index + 1],x[index + 2],y[index + 2],x[index + 3],y[index + 3]);
          index += 2

        }

        ctx.stroke()
  
      }

      //add DOTS
      for(var j = 0; j < x.length; j++){

        if (j == selectedIndex_dot)
          {ctx.fillStyle = "rgba(0, 0, 255, .7)";}
        else 
          {ctx.fillStyle = "rgb(0, 255, 0)";}

        drawDot(x[j],y[j], dotRadius);
        
      }

    }    

    function getPointOnCubicBezier(t, points){
      let [p0, p1, p2, p3] = points;
      result = []
      
      let x = (1-t)*(1-t)*(1-t)*p0[0] + 3*(1-t)*(1-t)*t*p1[0] + 3*(1-t)*t*t*p2[0] + t*t*t*p3[0];
      let y = (1-t)*(1-t)*(1-t)*p0[1] + 3*(1-t)*(1-t)*t*p1[1] + 3*(1-t)*t*t*p2[1] + t*t*t*p3[1];
      
      result.push(Math.round(x))
      result.push(Math.round(y))

      return result;

    }

    function getCubicBezierPoints(count, points){

      let [p0, p1, p2, p3] = points;
      let result = [p0]

      const increment = 1/count;

      for (let i = 1; i < count - 1; i++) {
        result.push(getPointOnCubicBezier( i * increment, points))
      }

      result.push(p3)

      return result

    }

    function curvesToLines(){

      bezierCurveIndeces.forEach( (elem, index) => {

        let points = [
          [x[elem], y[elem]],
          [x[elem+1], y[elem+1]],
          [x[elem+2], y[elem+2]],
          [x[elem+3], y[elem+3]],
        ]

        let points_result = getCubicBezierPoints(bezierSegments, points)

        x.splice(elem, 4)
        y.splice(elem, 4)

        points_result.forEach( (element, index) => {
          x.splice(elem + index, 0,  element[0])
          y.splice(elem + index, 0,  element[1])
        } )

        if(index < bezierCurveIndeces.length - 1){
          bezierCurveIndeces[index+1] = bezierCurveIndeces[index+1] + (index+1) * (bezierSegments - 4)
        }

      })

      bezierCurveIndeces = []

    }
    
    
  }

  function getSplineEditorOutput(){
    return [x,y]
  }