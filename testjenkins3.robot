*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary

*** Variables ***


*** Keywords ***

*** Test Cases ***

Get Request Test
    Create Session      google             http://www.google.com
    ${resp_google}=     GET On Session     google             /           expected_status=200
    log to console      ${resp_google} 
    Status should be    200    ${resp_google}
    Should be equal     ${200}    ${resp_google.status_code}
 