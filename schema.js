const joi = require('joi'); //we have to use joi to validate our schemas from server side.

module.exports.productSchema = joi.object({
   
        name: joi.string().required(),
        price: joi.number().required().min(0),
        category: joi.string().required(),
        type: joi.string().required(),
        image:joi.string().allow("", null),
        ingredients: joi.string().required(),
 
})