import * as Joi from "joi";

const claimsSchema = Joi.object()
  .keys({
    admin: Joi.boolean(),
    superAdmin: Joi.boolean().valid(true),
    manager: Joi.boolean(),
    tinnumber: Joi.string().length(9),
    branch: Joi.when("admin", {
      is: Joi.boolean().valid(false),
      then: Joi.when("tinnumber", {
        is: Joi.exist(),
        then: Joi.string().min(1).required(),
        otherwise: Joi.forbidden(),
      }),
      otherwise: Joi.forbidden(),
    }),
  })
  .with("manager", ["tinnumber", "branch"])
  .with("admin", "tinnumber")
  .with("branch", "tinnumber")
  .without("superAdmin", ["admin", "tinnumber", "branch"])
  .without("admin", ["branch"]);

const userCreateSchema = Joi.object({
  displayName: Joi.string().min(3).required(),
  password: Joi.string()
    .min(6)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/, {
      name: "at least (1 letter, 1 digit and 1 special character)",
    })
    .required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .regex(/^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
      name: "phone number format",
    })
    .allow(null, ""),
  claims: claimsSchema.min(1).required(),
  emailVerified: Joi.boolean().default(false),
});

const userUpdateSchema = Joi.object({
  uid: Joi.string().required(),
  displayName: Joi.string().min(3).required(),
  password: Joi.string()
    .min(6)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/, {
      name: "at least (1 letter, 1 digit and 1 special character)",
    }),
  email: Joi.string().email(),
  phoneNumber: Joi.string()
    .regex(/^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
      name: "phone number format",
    })
    .allow(null, ""),
  claims: claimsSchema,
  disabled: Joi.boolean(),
  emailVerified: Joi.boolean().default(false),
});

const deleteUserChema = Joi.object({uid: Joi.string().required()});

export const userDeleteValidate = (data: any) =>
  deleteUserChema.validate(data, {abortEarly: false});

export const userCreateValidate = (data: any) =>
  userCreateSchema.validate(data, {abortEarly: false});
export const userUpdateValidate = (data: any) =>
  userUpdateSchema.validate(data, {abortEarly: false});
