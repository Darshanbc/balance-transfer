--This scrip defines the roles of gpio pins. It takes care of fail-safe mode at start time. It uses mqtt module of NodeMCU to connect to broker and transmit data. It takes care of both manual and mobile application triggers for switching. 


sw_pin = 1              
sense_pin = 2
id=node.chipid()
 gpio.mode(sw_pin, gpio.OUTPUT)
 gpio.mode(5, gpio.OUTPUT)
 gpio.mode(6, gpio.OUTPUT)
 gpio.mode(sense_pin, gpio.INPUT)
 print("Starting Application")
 -- gpio.write(sw_pin, gpio.LOW)
 previous_state = 0
   previous_state = gpio.read(sense_pin)
   if previous_state == 1 then
   gpio.write(sw_pin, gpio.LOW)
   loadon = 0
   else  
   gpio.write(sw_pin, gpio.HIGH)
   loadon = 1
   end
   gpio.write(5, gpio.LOW)
   gpio.write(6, gpio.LOW)
flag=0
count =0
function get_data()           --This function reads the state of the switch after every 15 minutes and publishes it along with timestamp to the broker.
     if previous_state ~= gpio.read(sense_pin) then
     if gpio.read(sw_pin) == 1 then
       gpio.write(sw_pin, gpio.LOW)
       loadon = 0
      elseif gpio.read(sw_pin) == 0 then
      gpio.write(sw_pin, gpio.HIGH)
      loadon = 1
    end 
   end
   previous_state = gpio.read(sense_pin)
end
   --Connecting to MQTT Server for Subscribing....
   -- Create a server object with 120 second timeout
m=mqtt.Client("smartswitch", 120)
--m=mqtt.Client("clientid",120, "user", "gaurav1995")
m:lwt("/lwt", "offline", 0, 0)
m:on("connect",function(client) print("connected") end)
--m:on("offline", function(client) print("offline") end) 
sta_connect = m:connect("192.168.0.101", 1883, 0, function(client)   -- Specify the IP Address of device where Broker is running
      print("con_status = ",sta_connect)
function handle_mqtt_error(client, reason) 
 tmr.create():alarm(10000, tmr.ALARM_AUTO, function(cb_tmr)
    rc=do_mqtt_connect()
    if rc==0 then
      print("MQTT connection established")
      cb_tmr:unregister()
    else 
      print("checking mqtt connection")
    end
  end)
end

do_mqtt_connect=function()
  rc=m:connect("192.168.0.101",1883, 0, function(client) print("connected") end, handle_mqtt_error)
  return rc
end
   status = client:subscribe("topic/enable/101", 1, function(client) print ("enable subscribe success") end)   -- Subscribing to the topic so as to receive messages from AWS OR Mobile Application
end,
function(client, reason)
  print("failed sub reason: " .. reason)
end)   
    print("status of sub= ",status)
loadTopic=""
m:on("message", function(client,topic,data)     --message on receive event
     if topic==loadTopic then
        if data=="1" then
              gpio.write(sw_pin, gpio.HIGH)
              print("Received turnon for switch_1")
              loadon = 1         
        end
        if data == "0" then
               gpio.write(sw_pin, gpio.LOW) 
                 print("Received turnoff for switch_1")
               loadon = 0
            end
    end
      if topic=="topic/enable/101" then
        unsub_status=client:unsubscribe(loadTopic, function(conn) print("unsubscribe success") end)
        print("subscription status",unsub_status)
        loadTopic=data
        new_status= client:subscribe(data,1, function(client) print ("subscribe success") end)
        print("subscription status",new_status)
      end
    if data~=nil then
        print(topic)
        print(data)
       
       end
 end)
if count==60 then                     -- count checks the time for when to publish the message to broker.
   sec, usec =rtctime.get()
       a=sec, usec
      tm= rtctime.epoch2cal(a)                 --generating timestamps
      stamp=string.format("%02d",tm["min"])
      count=0;
      if (stamp=="00" or stamp=="15" or stamp=="45" or stamp=="30") then    --checking the timestamp for 15 minute period for publishing the state.
      flag=1;
      end
end
if (stamp=="00" or stamp=="15" or stamp=="45" or stamp=="30") and flag==1 then
tp="dump" .. "/"
mac=wifi.sta.getmac()
top=tp .. mac                                                   -- Unique Topic containing MAC-ID.
x=gpio.read(sw_pin)
 sec, usec =rtctime.get()
       a=sec, usec
      tm= rtctime.epoch2cal(a)
       print(string.format("%04d/%02d/ %02d %02d:%02d:%02d", tm["year"], tm["mon"], tm["day"], tm["hour"], tm["min"], tm["sec"]))
       if x==1 then
          y="ON"
       else
          y="OFF"
       end
     p={y,sec,usec,mac}                                       --Message to be sent to broker containing state,mac-addressa and timestamp.
     s=table.concat(p," ")
m:connect("192.168.0.101", 1883, 0, function(client)
       print("connected")
          --status_pub = client:publish(top,s, 1, 0, function(client) print("sent") end)end)
          status_pub = client:publish(top,s,1,0, function(client) print("sent") end)
end,
function(client, reason)
  print("failed reason: " .. reason)
end)
          print("pub stat= ",status_pub)
flag=0;  
end
-- m:close()
count=count+1
--end
tmr.alarm(0,500, 1,function() get_data() end)  -- Timer to care of manual switching. 

