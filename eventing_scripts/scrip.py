import sys, json,ast,pexpect,os,re


def main():
    #get our data as an array from read_in()
    lines = sys.argv[1]
    org=sys.argv[2]
    sites= ast.literal_eval(lines)
    ext=sites["extensionNumber"]
    switchID=sites["switchID"]
    fi=open("./switchid.txt","w")
    fi.write(switchID)
    fi.close()

    proc = pexpect.spawn("sudo cp /usr/local/etc/restricted-sites.squid /usr/local/etc/restricted-sites.squid.tmp")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)

    # os.system("cp /usr/local/etc/restricted-sites.squid /usr/local/etc/restricted-sites.squid.tmp" )
    f=open("./app/restricted-sites.squid","w")
    
    for site in sites["restrictedSites"]:
    	f.write(site)
    	f.write("\n")
    f.close()
    proc = pexpect.spawn("sudo mv ./app/restricted-sites.squid /usr/local/etc/restricted-sites.squid")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)#"sudo mv ./app/restricted-sites.squid /usr/local/etc/")
    # proc.sendline("sudo service squid restart" )
    # now send the password to the waiting shell

    proc = pexpect.spawn("sudo cp /usr/local/etc/restricted-sites.squid /usr/local/etc/restricted-sites.squid.tmp")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)
    
    proc = pexpect.spawn("sudo service squid restart")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)
# ------------------sip.conf-------------------
    proc = pexpect.spawn("sudo cp /etc/asterisk/sip.conf /etc/asterisk/sip.temp")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)

    p=open("sip.temp","w+") 
    f=open('/etc/asterisk/sip.conf',"r")
    chkcontext=0
    for linef in f: 
        if ext in linef:
            chkcontext=1
        if chkcontext==1 and "context" in linef:
            p.write("context="+org+"\n")
            chkcontext=0
        else:
            p.write(linef)

    p.close()
    # shutil.move("sip.temp","/etc/asterisk/sip.conf")
    proc = pexpect.spawn("sudo mv sip.temp /etc/asterisk/sip.conf")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)

# -----------------extension.conf----------------------
    proc = pexpect.spawn("sudo cp /etc/asterisk/extensions.conf /etc/asterisk/extensions.temp")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)
    with open("/etc/asterisk/extensions.conf", "r") as f, open("ext.temp","w") as p:
        # pdb.set_trace()
        # f.seek(100)
        # print(f.readline())
        for linef in f:
            if  re.search(r"\[.+\]",linef) and "["+org+"]" in linef:
                p.write(linef)
                p.write("exten => "+ext+",1,Answer()\n")
                p.write("exten => "+ext+",2,Dial(SIP/"+ext+",60)\n")
                p.write("exten => "+ext+",3,Playback(vm-nobodyavail)\n")
                p.write("exten => "+ext+",3,Playback(vm-nobodyavail)\n")
                p.write("exten => "+ext+",4,VoiceMail("+ext+"@main)\n")                              
                p.write("exten => "+ext+",5,Hangup()\n\n")
            
            elif ext+"," in linef:  
                pass
            else:
                p.write(linef)
    proc = pexpect.spawn("sudo mv ext.temp /etc/asterisk/extensions.conf")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)

    # ----------------astrisk restart--------------------
    proc = pexpect.spawn("sudo asterisk -rx reload")
    proc.expect("[Pp]assword")
    proc.sendline("rtcin123")
    proc.expect(pexpect.EOF, timeout=None)
# ----------------------switch enable-----------------------
    os.system('mosquitto_pub -h 192.168.0.101 -t topic/enable/101 -m topic/'+org+'/'+switchID)
    print("operation completed"+lines)# type(lines)

    #return the sum to the output stream
    

#start process
if __name__ == '__main__':
    main()

