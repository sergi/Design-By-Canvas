start
 = call+

call
 = command:(block_command / command) _ lb* { return command }

command
 = _ cmd:[A-Za-z0-9?]+ args:((ws+ value)+)? _ lb+ {
     return {
         type: "command",
         name: cmd.join("").toLowerCase(),
         args: args ? args.map(function(a) { return a[1] }) : null
     }
   }

block
 = "{" lb* e:(block_command / command)+ lb* _ "}" { return e }

block_command
 = e:command _ b:block lb* {
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
 = "<" _ left:variable args:(ws value)+ ">" {
    return {
            type: "special",
            args: [left, args.map(function(a) { return a[1] })]
    }
}

additive
  = left:muldiv _ sign:[+-] _ right:additive { return { cmd:sign, args:[left,right] }}
  / muldiv

muldiv
  = left:primary _ sign:[*/] _ right:muldiv {
        return { cmd: sign, args:[left, right] }
    }
  / primary

primary
  = (variable / integer / special)
  / "(" _ additive:additive _ ")" { return additive; }

value
 = variable / integer / additive / point / special

comment
 = "//" (!lb .)*

ws
 = [ \t]

_
 = (ws / comment)*

lb
 = "\n"

