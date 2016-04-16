#
# Makefile
#
# Start with @ to hide source
#
# If you get "*** missing separator.  Stop.", it means you have spaces where 
# there should be a tab
#
# Tips:
#   - For $ signs, you'll need to escape with $ (ex. $$)
#   - $! gets the PID of the last process
# 
# @author Eugene Song <tilleps@gmail.com>
#

NODE_ENV?=production
ENTRY_POINT=`echo "process.stdout.write(require('./package.json').main)" | node`
ENV_DECRYPTED_PATH="env/${NODE_ENV}.env"
ENV_ENCRYPTED_PATH="etc/env/${NODE_ENV}.env"
RECIPIENTS_PATH="etc/recipients/${NODE_ENV}.txt"

.PHONY: build debug decrypt develop encrypt install run start start-troubleshoot troubleshoot


build:
	./node_modules/.bin/gulp --gulpfile ./node_modules/devstack-devel/gulpfile.js --cwd .

debug:	
	echo ${NODE_ENV}
	echo ${ENV_DECRYPTED_PATH}
	echo ${ENTRY_POINT}

# Alternative
#gpg --output - --decrypt ${ENV_ENCRYPTED_PATH} | tee ${ENV_DECRYPTED_PATH}
decrypt:
	@gpg --output ${ENV_DECRYPTED_PATH} --decrypt ${ENV_ENCRYPTED_PATH}

encrypt:
	@test -s ${RECIPIENTS_PATH} || echo "Recipients not defined in file: ${RECIPIENTS_PATH}"
	@test -s ${RECIPIENTS_PATH} || exit 1
	@gpg --yes --output ${ENV_ENCRYPTED_PATH} --encrypt `cat ${RECIPIENTS_PATH} | xargs -I '{}' echo "--recipient" {}` ${ENV_DECRYPTED_PATH}

# Alternative
#@env `gpg -q --output - --decrypt ${ENV_ENCRYPTED_PATH} | xargs` nodemon ${ENTRY_POINT}
develop:
	env `cat ${ENV_DECRYPTED_PATH} | xargs` nodemon -e js,ejs,env,hbs,json --ignore src/ ${ENTRY_POINT}

install: decrypt
	npm install 

run: troubleshoot
	@test -s ${ENV_DECRYPTED_PATH} || exit 1
	@env `cat ${ENV_DECRYPTED_PATH} | xargs` node ${ENTRY_POINT}

troubleshoot:
	@test -s ${ENV_DECRYPTED_PATH} || echo "Config file missing: ${ENV_DECRYPTED_PATH}"
	
start: start-troubleshoot
	@test -s ${ENV_ENCRYPTED_PATH} || exit 1
	@env `gpg -q --output - --decrypt ${ENV_ENCRYPTED_PATH} | xargs` node ${ENTRY_POINT}

start-troubleshoot:
	@test -s ${ENV_ENCRYPTED_PATH} || echo "Encrypted config file missing: ${ENV_ENCRYPTED_PATH}"
