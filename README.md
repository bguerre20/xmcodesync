# xmcodesync README

- This is xmatters code sync! This tool is used to push and pull script to an xmatters cloud instance.

# Instructions
 
- use Ctl + Shift + P to bring up the command terminal for all commands.
- start typing 'xm' to see all commands available (push, pull, setup)
- run xMatters:Setup first.
    - you can enter your instance shortname or the base url:
    - base url example: https://bguerre.xmatters.com
    - shortname example: bguerre
- enter the user credentials used for REST API calls, first username, then password.
- if information was entered correctly a popup message saying "test connection succesfull" will appear.
- run command xMatters:Pull.
    - if configured correctly a drop down picker will appear with all the instances communication plans.
    - select the communication plan, then script you want to work on
- Code your heart out
- When you are done and are ready to push back to the instance use command xmatters:Push

WARNING: This extension is in active development and will break if you try to break it. For best results pull / push one script at a time. The extension will insert 3 lines of code at the top of your script for indentifying purposes when pushing back up to the instance. DO NOT REMOVE THESE LINES. The extension will automagically remove them when pushing the code back to the cloud.


# Features

## Configure which xmatters instance to sync with.
![](https://i.imgur.com/PoSy67z.gif)

## Pull script
![](https://i.imgur.com/KN6AC09.gif)

## Push script
![](https://i.imgur.com/elhPvlr.gif)

# Requirements

- An existing xmatters instance and account with sufficient privelages to do REST API calls on the instance.

# Known Issues

- Only functional with single push / pull down of files. pulling multiple files and pushing randomly will probably break the app or put the wrong code in the wrong location on your instance. Recommended use case: pull single script down, work on it, push it back up, close script. 

# Release Notes

Users appreciate release notes as you update your extension.

### 0.1.0 - MVP

Initial release of xmcode sync. Still in beta and ironing out all edge cases. Push, pull, and setup of a single instance are working.


-----------------------------------------------------------------------------------------------------------