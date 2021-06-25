class table{
    constructor(json,svg) {
        this.svg = svg;
        this.matrix = json.matrix;
	this.row_labels = json.row_labels;
	this.col_labels = json.col_labels;
	this.row_perm = json.row_permutation;
	this.col_perm = json.col_permutation;
	this.row_inv; 
        this.col_inv;
	this.n = this.matrix.length;
	this.m = this.matrix[0].length;
        
    if (! this.row_labels) {
	this.row_labels = Array(this.n);
	for (let i = 0; i < this.n; i++) 
	    this.row_labels[i] = i+1;
    }
    if (! this.col_labels) {
	this.col_labels = Array(this.m);
	for (let i = 0; i < this.n; i++) 
	    this.col_labels[i] = i+1;
    }

    if (! this.row_perm)
	this.row_perm = reorder.permutation(this.n);
    this.row_inv = reorder.inverse_permutation(this.row_perm);

    if (! this.col_perm)
	this.col_perm = reorder.permutation(this.m);
    this.col_inv = reorder.inverse_permutation(this.col_perm);

    var colorLow = 'white', colorHigh = 'black', colorGrid = 'grey';
    var max_value = d3.max(this.matrix.map(function(row) { return d3.max(row); })),
	color = d3.scale.linear()
	    .range([colorLow, colorHigh])
	    .domain([0, max_value]);

    var gridSize = Math.min(width / this.matrix.length, height / this.matrix[0].length);
	this.h = gridSize;
	this.th = this.h*this.n;
	this.w = gridSize;
	this.tw = this.w*this.m;

    var h = this.h;
    var row_inv = this.row_inv;
    var row = this.svg
	    .selectAll(".row")
	    .data(this.matrix, function(d, i) { return 'row'+i; })
	    .enter().append("g")
            .attr("id", function(d, i) { return "row"+i; })
            .attr("class", "row")
            .attr("transform", function(d, i) {
		return "translate(0,"+h*row_inv[i]+")";
	    });

    var w = this.w;
    var col_inv = this.col_inv;
    var cell = row.selectAll(".cell")
	    .data(function(d) { return d; })
	    .enter().append("rect")
            .attr("class", "cell")
            .attr("x", function(d, i) { return w*col_inv[i]; })
            .attr("width", w)
            .attr("height", h)
            .style("fill", function(d) { return color(d); });

    row.append("line")
	.attr("x2", this.tw)
        .style("stroke", colorGrid);

    var row_labels = this.row_labels;
    row.append("text")
	.attr("x", -6)
	.attr("y", h / 2)
	.attr("dy", ".32em")
	.attr("text-anchor", "end")
	.text(function(d, i) { return row_labels[i]; });

    var col = this.svg.selectAll(".col")
	    .data(this.matrix[0])
	    .enter().append("g")
	    .attr("id", function(d, i) { return "col"+i; })
	    .attr("class", "col")
	    .attr("transform", function(d, i) { return "translate(" + w*col_inv[i] + ")rotate(-90)"; });

    col.append("line")
	.attr("x1", -this.th)
        .style("stroke", colorGrid);

    var col_labels = this.col_labels;
    col.append("text")
	.attr("x", 12)
	.attr("y", w / 2 - 26)
	.attr("dy", ".32em")
	.attr("text-anchor", "start")
        .attr("transform", "rotate(90)")
	.text(function(d, i) { return col_labels[i]; });

    svg.append("rect")
	.attr("width", this.tw)
	.attr("height", this.th)
	.style("fill", "none")
	.style("stroke", colorGrid);

   
}
    
    order(rows, cols) {
        var x = function(i){ return this.w*this.col_inv[i]; },
            y = function(i){ return this.h*this.row_inv[i]; };
	this.row_perm = rows;
	this.row_inv = reorder.inverse_permutation(this.row_perm);
	this.col_perm = cols;
	this.col_inv = reorder.inverse_permutation(this.col_perm);
	
	var t = this.svg.transition().duration(0);
        var w = this.w,
            h = this.h,
            col_inv = this.col_inv,
            row_inv = this.row_inv;
	t.selectAll(".row")
            .attr("transform", function(d, i) {
		return "translate(0," + h*row_inv[i] + ")"; })
	    .selectAll(".cell")
            .attr("x", function(d, i) { return w*col_inv[i]; });

	t.selectAll(".col")
            .attr("transform", function(d, i) {
		return "translate(" + w*col_inv[i] + ")rotate(-90)"; });
    }
    
    computeMorans(permuted){
        // Moran's i
        var N = this.row_perm.length * this.col_perm.length;
//        var W = (this.row_perm.length-2) * (this.col_perm.length-2) * 8 + (this.row_perm.length-2) * 5 * 2 + (this.col_perm.length-2) * 5 * 2 + 12;
        var W = (this.row_perm.length-2) * (this.col_perm.length-2) * 4 + (this.row_perm.length-2) * 3 * 2 + (this.col_perm.length-2) * 3 * 2 + 8;
        
        
        var meank = 0;
        for (var i = 0; i < permuted.length; i++) {
            for (var j = 0; j < permuted[0].length; j++) {
                meank += permuted[i][j];
            }
        }
//        mean = mean / N;
        var num = 0, denom = 0;
        for (var j = 0; j < permuted.length; j++) {
            for (var i = 0; i < permuted[0].length; i++) {
                denom += Math.pow(permuted[j][i] - meank/N, 2);
                var innersum = 0;
                for (var y = Math.max(0,j-1); y < Math.min(permuted.length,j+2); y++) {
                    for (var x = Math.max(0,i-1); x < Math.min(permuted[0].length,i+2); x++) {
                        if(y !== j || x !== i){
                            // Counting Diagonal Neighbours
//                            if(i - x >= -1 && i - x <= 1 && y - j >= -1 && y - j <= 1){
//                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
//                            }
                            // Not Counting Diagonal Neighbours
                            if(i - x >= -1 && i - x <= 1 && j === y){
                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
                            }
                            if(i === x && j - y >= -1 && j - y <= 1){
                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
                            }
                        }
                    }
                }
                num += innersum;
            }
        }
        
//        console.log("Morans log");
//        console.log(N);
//        console.log(W);
//        console.log(num);
//        console.log(denom);
        if(num === 0 && denom === 0){
            return[1,num];
        }
        return [((N/W) * (num/denom))/(N*N),num];
    }
    
    print(){
        
        var permuted = [];
        for (var i = 0; i < this.row_perm.length; i++) {
            permuted.push([]);
            for (var j = 0; j < this.col_perm.length; j++) {
                permuted[i].push(this.matrix[this.row_perm[i]][this.col_perm[j]]);
            }
        }
        var res = "";
        for (var j = 0; j < this.col_perm.length; j++) {
                res += "\t" + this.col_perm[j];
        }
        for (var i = 0; i < permuted.length; i++) {
            res += "\n " + this.row_perm[i];
            for (var j = 0; j < permuted.length; j++) {
                res += "\t" + permuted[i][j];
            }
        }
        return res;
    }
    
    quality(){
        
        var permuted = [];
        for (var i = 0; i < this.row_perm.length; i++) {
            permuted.push([]);
            for (var j = 0; j < this.col_perm.length; j++) {
                permuted[i].push(this.matrix[this.row_perm[i]][this.col_perm[j]]);
            }
        }
        
        var bandwidth = 0;
        var linarr = 0;
//        console.log(this.matrix);
        for(var i=0 ; i< this.row_perm.length; i++){
            for(var j=0 ; j<this.col_perm.length ; j++){
                if(i!==j && this.matrix[i][j] === 1){
                    var lambda = 0;
                    var b = false;
                    for(var k=0; k<this.row_perm.length; k++){    
                        if(this.row_perm[k] === i || this.row_perm[k] === j){
                            b = !b;
                        }
                        if(b){
                            lambda++;
                        }
                    }
                    linarr += lambda;
                    if(lambda > bandwidth){
                        bandwidth = lambda;
                    }
                }
            }
        }
//        return max;
        var profile = 0;
        for(var i=0 ; i< this.row_perm.length; i++){
            var min = this.col_perm.length ;
            for(var j=0 ; j<this.col_perm.length ; j++){
                if(this.row_perm[i]===this.row_perm[j] || this.matrix[this.row_perm[i]][this.col_perm[j]] === 1){
                    if(j<min){
                        min = j;
                    }
                    
                }
            }
            profile += i - min;
        }
        
        var bbadjacencies = 0;
        var bwadjacencies = 0;
        var wwadjacencies = 0;
        for(var i=0 ; i< this.row_perm.length; i++){
            for(var j=0 ; j<this.col_perm.length ; j++){
                if(i<this.row_perm.length-1){
                    if(permuted[i][j] === 1){
                        bbadjacencies += permuted[i+1][j];
                        bwadjacencies += 1 - permuted[i+1][j];
                    }
                    if(permuted[i][j] === 0){
                        bwadjacencies += permuted[i+1][j];
                        wwadjacencies += 1 - permuted[i+1][j];
                    }
                }
                if(j<this.col_perm.length-1){
                    if(permuted[i][j] === 1){
                        bbadjacencies += permuted[i][j+1];
                        bwadjacencies += 1 - permuted[i][j+1];
                    }
                    if(permuted[i][j] === 0){
                        bwadjacencies += permuted[i][j+1];
                        wwadjacencies += 1 - permuted[i][j+1];
                    }
                } 
            }
        }
        
        
        
        var moran = this.computeMorans(permuted)[0];
        
        return [bandwidth,profile,linarr,moran,bbadjacencies,bwadjacencies,wwadjacencies];
    }
    
    
    
    checkMoran(){
        var permuted = [];
        var permuted1 = [];
        var permuted2 = [];
        for (var i = 0; i < this.row_perm.length; i++) {
            permuted.push([]);
            permuted1.push([]);
            permuted2.push([]);
            for (var j = 0; j < this.col_perm.length; j++) {
                permuted[i].push(this.matrix[this.row_perm[i]][this.col_perm[j]]);
                permuted1[i].push(this.matrix[this.row_perm[i]][this.row_perm[j]]);
                permuted2[i].push(this.matrix[this.col_perm[i]][this.col_perm[j]]);
            }
        }
        
          var moran = this.computeMorans(permuted)[1];
          var moran1 = this.computeMorans(permuted1)[1];
          var moran2 = this.computeMorans(permuted2)[1];
          
//        var moran = (N/W) * (num/denom);
//        moran = Math.round(moran * 100000000) / 100000000;
//        var moran1 = (N/W) * (num1/denom1);
//        moran1 = Math.round(moran1 * 100000000) / 100000000;
//        var moran2 = (N/W) * (num2/denom2);
//        moran2 = Math.round(moran2 * 100000000) / 100000000;
        
        if(moran > moran1 && moran > moran2){
            console.log("!!--- Found faulty Matrix ---!!");
            console.log("Scores: " + moran + ", " + moran1 + ", " + moran2);
            console.log(permuted);
            console.log(permuted1);
            console.log(permuted2);
            
        }
        
        
        
    }
    
    computeMoransRows(rows){
        var permuted = [];
        for (var i = 0; i < rows.length; i++) {
            permuted.push([]);
            for (var j = 0; j < rows.length; j++) {
                permuted[i].push(this.matrix[rows[i]][rows[j]]);
            }
        }
        // Moran's i
        var N = rows.length * rows.length;
//        var W = (this.row_perm.length-2) * (this.col_perm.length-2) * 8 + (this.row_perm.length-2) * 5 * 2 + (this.col_perm.length-2) * 5 * 2 + 12;
        var W = (rows.length-2) * (rows.length-2) * 4 + (rows.length-2) * 3 * 2 + (rows.length-2) * 3 * 2 + 8;
        
        
        var meank = 0;
        for (var i = 0; i < permuted.length; i++) {
            for (var j = 0; j < permuted[0].length; j++) {
                meank += permuted[i][j];
            }
        }
//        mean = mean / N;
        var num = 0, denom = 0;
        for (var j = 0; j < permuted.length; j++) {
            for (var i = 0; i < permuted[0].length; i++) {
                denom += Math.pow(permuted[j][i] - meank/N, 2);
                var innersum = 0;
                for (var y = Math.max(0,j-1); y < Math.min(permuted.length,j+2); y++) {
                    for (var x = Math.max(0,i-1); x < Math.min(permuted[0].length,i+2); x++) {
                        if(y !== j || x !== i){
                            // Counting Diagonal Neighbours
//                            if(i - x >= -1 && i - x <= 1 && y - j >= -1 && y - j <= 1){
//                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
//                            }
                            // Not Counting Diagonal Neighbours
                            if(i - x >= -1 && i - x <= 1 && j === y){
                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
                            }
                            if(i === x && j - y >= -1 && j - y <= 1){
                                innersum += (permuted[j][i] * N - meank) * (permuted[y][x] * N - meank);
                            }
                        }
                    }
                }
                num += innersum;
            }
        }
        return ((N/W) * (num/denom))/(N*N);
    }
}

