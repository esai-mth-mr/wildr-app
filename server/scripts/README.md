
# Inspecting objects in node core dump

```shell
apt-get install lldb
npm install -g llnode
llnode node -c ~/cores/core.28
```

## Run the python console in llnode

After starting the console, run the python script, load the command and run it:

```python
>>> script
>>> exec(open("./find_operationName.py").read())
>>> find_operationName_references(lldb.debugger, "", None, None)
```
In this example, it will output all objects that have `operationName`,
dereference it and output the string value. Then it will count the number of
operationName values it found.

