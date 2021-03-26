*** Settings ***
Resource  ../import.robot

*** Keywords ***
generate x-request id
  ${uuid}  evaluate  uuid.uuid4()  uuid
  ${x-request-id}  convert to string  ${uuid}
  [Return]  ${x-request-id}