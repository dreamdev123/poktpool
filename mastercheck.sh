#!/usr/bin/env ksh

# Stub function - if called with argument "master" or
# "backup" we will return the appropriate response.
if [[ $1 == "master" ]]; then
        return 0
elif [[ $1 == "backup" ]]; then
        return 1
fi

# If carp interface reports anything other than "MASTER", we're a backup.
if (ifconfig carp0 | grep -Fqo 'MASTER'); then
        return 0
else
        return 1  
fi
