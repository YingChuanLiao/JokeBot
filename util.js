module.exports = {
    /**
     * This function checks whether there are properties whose value is negative in preference.
     * Then replace it with the new property in the otherJokesInfo
     * @param {object} preference an object to store personal joke's preference 
     * @param {object} jokesInfo an object to store jokes topic and content
     * @param {object} otherJokesInfo an object to store jokes topic and content
     * @return {boolean} whether the topics should be change or not
     */
    switchTopics: function(preference,jokesInfo,otherJokesInfo){
        let needSwitch = false;
        let copyJI = JSON.parse(JSON.stringify(jokesInfo));
        let copyOJI = JSON.parse(JSON.stringify(otherJokesInfo));
        let removeKeys = [];
        for (let key in preference){
            if(preference[key] < 0){
                needSwitch = true;
                removeKeys.push(key);
                delete preference[key];
                delete jokesInfo[key];
            }
        }
        let newKeys = [];
        for (let i = 0; i < removeKeys.length; i++){
            let newKeyList = Object.keys(otherJokesInfo);
            let newkey = newKeyList[newKeyList.length * Math.random()<<0];
            newKeys.push(newkey);
            delete otherJokesInfo[newkey];
        }
        for (let i = 0; i < removeKeys.length; i++){
            otherJokesInfo[removeKeys[i]] = copyJI[removeKeys[i]];
            jokesInfo[newKeys[i]] = copyOJI[newKeys[i]];
        }
        return needSwitch;
    },
    /**
     * This function allow users to give the rate of a joke he read and store in preference
     * @param {boolean} r true means good joke and vice versa
     * @param {object} preference an object to store personal joke's preference
     * @param {string} currentTopic current joke topic
     * @return 
     */
    giveScore: function(r,preference,currentTopic){
        let score = r? 1:-1;
        let keys = Object.keys(preference);
        if (!keys.includes(currentTopic)){
            preference[currentTopic] = score;
        }
        else{
            preference[currentTopic]+=score;
        }
    },
    /**
     * This function reads in user's rateInfo and return whether the information is positive or negative
     * @param {object} rateInfo an object carrying specific format
     * @return {boolean||null} return boolean means the info can be parsed , otherwise return null
     */
    
    rating: function(rateInfo){
        // if user do not rate
        if (!rateInfo) return null;
        for (let i = 0; i < rateInfo.length; i++){
            if (rateInfo[i].value == "good" && rateInfo[i].confidence > 0.5)
                return true;
            else if (rateInfo[i].value == "bad" && rateInfo[i].confidence > 0.5)
                return false;
        }
        // if the user' ratings do not indicate good or bad
        return null;
    }
};