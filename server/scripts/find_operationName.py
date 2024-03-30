import lldb
from collections import Counter

def remove_ansi_escape_codes(s):
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    return ansi_escape.sub('', s)

def find_operationName_references(debugger, command, result, internal_dict):
    # Get the target and process
    target = debugger.GetSelectedTarget()
    process = target.GetProcess()

    # Find all objects with property 'operationName'
    objects_cmd = "v8 findrefs -n operationName"
    interpreter = lldb.debugger.GetCommandInterpreter()
    return_obj = lldb.SBCommandReturnObject()
    interpreter.HandleCommand(objects_cmd, return_obj)

    # Split the output into lines
    output_lines = return_obj.GetOutput().split('\n')

    items = []
    # Loop through the results, inspecting each
    for line in output_lines:
        if not line.strip():
            continue
        obj_address = line.split('=')[1]
        inspect_cmd = "v8 inspect -F " + remove_ansi_escape_codes(obj_address).strip()
        interpreter.HandleCommand(inspect_cmd, return_obj)
        res = remove_ansi_escape_codes(return_obj.GetOutput())
        match = re.search(r'\"([^\"]+)\"', res)
        if match is None:
          print("did not find for " + res)
          continue
        items.append(match.group(1))
    print(Counter(items))        

#lldb.debugger.HandleCommand('command script add -f find_operationName_references.find_operationName_references find_operationName')
#print("Command `find_operationName` added.")
