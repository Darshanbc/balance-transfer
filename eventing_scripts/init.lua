--  if this file is saves as 'init.lua' in nodeMCU, it will run automatically.
--  if that isn't required, save it as 'init.lua' and use dofile("init2.lua") to run this code as well as 'switch.lua'

--  startup function
function startup()
    print("Running")
    -- the actual application is stored in 'switch.lua'
    --sntp.sync("time.nist.gov",function(sec, usec, server, info) print('synced', sec, usec, server) end, function() print('failed to sync!') end)

    dofile("switch.lua")
    file.close("init.lua")
end

--  connecting to wifi using usename and password
print("Connecting to WiFi access point...")
wifi.setmode(wifi.STATION)
station_cfg={}
station_cfg.ssid="urjalabswifi"
station_cfg.pwd="urjalabswifi"
wifi.sta.config(station_cfg)
--wifi.sta.connect()

--  wifi.sta.connect() not necessary because config() uses auto-connect=true by default

--  continously tries to connect to wifi till it establishes the connection
tmr.create():alarm(1000, tmr.ALARM_AUTO, function(cb_timer)
    if wifi.sta.getip() == nil then
        print("Waiting for IP address...")
    else
        cb_timer:unregister()
        print("WiFi connection established, IP address: " .. wifi.sta.getip())
        print("You have 3 seconds to abort")
        print("Waiting...")
        -- command below makes the alarm signal only once
        -- remove the below line it that is not needed
       tmr.create():alarm(5000, tmr.ALARM_SINGLE, startup)
    end 
end)
