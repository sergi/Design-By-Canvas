var Interpreter = function(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.vars = {}
}

/*
 * gray2rgb transforms a 0 to 100 gray value into a rgb
 * string compatible with canvas
 */
Interpreter.gray2rgb = function(gray) {
    var value = Math.ceil(255 - (gray * 2.55))
    return "rgb(" + value + "," + value  +"," + value + ")"
}

Interpreter.expTable = {
    "*": function(a, b) { return parseInt(a * b) },
    "/": function(a, b) { return parseInt(a / b) },
    "+": function(a, b) { return parseInt(a + b) },
    "-": function(a, b) { return parseInt(a - b) },

    paper: function(p) {
        var ctx = this.ctx
        var w = ctx.canvas.clientWidth
        var h = ctx.canvas.clientHeight

        ctx.fillStyle = Interpreter.gray2rgb(p.args[0])
        ctx.fillRect(0, 0, w, h)
    },
    pen: function(p) {
        this.ctx.strokeStyle = Interpreter.gray2rgb(p.args[0])
    },
    line: function(p) {
        var a = p.args
        var ctx = this.ctx
        var height = ctx.canvas.clientHeight

        ctx.moveTo(a[0], (height-a[1]))
        ctx.lineTo(a[2], (height-a[3]))
        ctx.stroke()
    },

    /*
     * Set sets a variable in the global scope. If the destination
     * is a point, it is assumed that the value will be a color.
     */
    set: function(p) {
        var dest = p.args[0]
        if (dest.type == "point") {
            var ctx = this.ctx
            var h = ctx.canvas.clientHeight
            var w = ctx.canvas.clientWidth
            var imageData = ctx.getImageData(0, 0, w, h)

            var index = (dest.x + (h-dest.y) * imageData.width) * 4

            var colorValue = Math.ceil(255 - (p.args[1] * 2.55))
            imageData.data[index+0] = colorValue
            imageData.data[index+1] = colorValue
            imageData.data[index+2] = colorValue
            imageData.data[index+3] = 0xff

            ctx.putImageData(imageData, 0, 0)
        } else {
            this.r.vars[p.args[0]] = p.args[1]
        }
    },
    repeat: function(p) {
        var args = p.args,
            id = args[0], f = args[1], c = args[2],
            // Cloning context object because otherwise we will change
            // properties of the parent context, messing up everything
            scopeObj = _.clone(p.scope) || {}

        _.each(_.range(f, c), function(n) {
            scopeObj[id] = n
            this.evalExpression(p.block, scopeObj)
        }, this)
    },
    command: function(p) {
        var args = _.rest(p.args)

        Interpreter.expTable[p.args[0]] = function(_p) {
            // Cloning context object because otherwise we will change
            // properties of the parent context, messing up everything
            var scopeObj = _.clone(p.scope) || {}

            _.each(args, function(p, i) { scopeObj[p] = _p.args[i] })
            this.evalExpression(p.block, scopeObj)
        }
    }
}

Interpreter.typeTable = {
    "command": function(e, scope) {
        var values = _.map(e.args, function(a) {
                return this.evalType(a, scope)
            }, this)
        return Interpreter.expTable[e.name].apply(this, values)
    },
    "string": function(e, scope) {
        var vars = this.r.vars
        var v = e.value

        if (scope && scope.hasOwnProperty(v)) return scope[v]
        else if (vars.hasOwnProperty(v))      return vars[v]

        return v
    },
    "integer": function(e, scope) { return e.value },
    "point": function(e, scope) {
        return {
            type: "point",
            x: this.evalType(e.x, scope),
            y: this.evalType(e.y, scope)
        }
    }
}

Interpreter.prototype = {
    evalType: function (e, scope) {
        return Interpreter.typeTable[e.type].call(this, e, scope)
    },
    evalExpression: function(ast, scope) {
        _.each(ast, function (c) {
            var args = _.map(c.args, function(a) {
                return this.evalType(a, scope)
            }, this)
            Interpreter.expTable[c.name].call(this, {
                args: args,
                block: c.block,
                scope: scope
            })
        }, this)
    },
    reset: function() {
        var ctx = this.ctx
        // Resets all cnavas state and properties
        this.canvas.width = this.canvas.width
        this.r = { vars: {}, cmds: {} }
    }
}

