start
 = call+ 

call
 = command:(block_command / command) ws* lb* { return command }

command
 = ws* cmd:[A-Za-z0-9?]+ args:((ws+ value)+)? lb+ {
     return {
         type: "command",
         name: cmd.join("").toLowerCase(), 
         args: args ? args.map(function(a) { return a[1] }) : null
     }
   }

block
 = "{" lb* e:(block_command / command)+ lb* ws* "}" { return e }

block_command
 = e:command ws* b:block lb* { 
     e.block = b; 
     return e;
}

variable
 = v:[A-Za-z0-9]+ { return { type: "string", value: v.join("") } }

integer
  = digits:[0-9]+ { return { type: "integer", value: parseInt(digits.join(""), 10) } }

point
 = "[" left:value ws right:value "]" { return { type: "point", x:left, y:right } }

special
 = "<" ws* left:variable args:(ws value)+ ">" { 
    return { 
            type: "special", 
            args: [left, args.map(function(a) { return a[1] })] 
    }
}

additive
  = left:muldiv (ws*)? sign:[+-] (ws*)? right:additive { return { cmd:sign, args:[left,right] }}
  / muldiv

muldiv
  = left:primary (ws*)? sign:[*/] (ws*)? right:muldiv { 
        return { cmd: sign, args:[left, right] } 
    }
  / primary

primary
  = (variable / integer / special)
  / "(" (ws*)? additive:additive (ws*)? ")" { return additive; }

value
 = variable / integer / additive / point / special

ws
 = [ \t]

lb
 = "\n"

