import os,sys

# fi=open("./switchId.txt","w")
# for i in range(len(sys.argv)):
# 	fi.write(sys.argv[i]+"\n")	
# fi.write(sys.argv[1]+" "+sys.argv[2]+" "+sys.argv[3])
os.system('mosquitto_pub -h 192.168.0.101 -t topic/'+sys.argv[2]+'/'+sys.argv[3]+' -m '+sys.argv[1])
print(sys.argv[2])
