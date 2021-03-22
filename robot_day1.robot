*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary

*** Variables ***


*** Keywords ***

*** Test Cases ***
Search on the google
    
    Open Browser    https://www.google.com    Chrome
    Maximize Browser Window
    input text     //input[@class="gLFyf gsfi"]	  facebook 
    Press Keys    //input[@class="gLFyf gsfi"]    ENTER