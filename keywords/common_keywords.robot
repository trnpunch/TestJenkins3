*** Settings ***
Resource  ../import.robot

*** Keywords ***
http response status from '${response}' should be '${expected_http_response_status}'
  should be equal as integers  ${response.status_code}  ${${expected_http_response_status}}