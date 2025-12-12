/**
 * Joi Validation Schemas for Auth
 */

import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tên không được để trống",
    "string.min": "Tên phải có ít nhất 2 ký tự",
    "string.max": "Tên không được quá 100 ký tự",
    "any.required": "Tên là bắt buộc",
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu không được quá 128 ký tự",
    "any.required": "Mật khẩu là bắt buộc",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Mật khẩu là bắt buộc",
  }),
  remember: Joi.boolean().default(false),
});

export const forgotSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email không được để trống",
    "string.email": "Email không hợp lệ",
    "any.required": "Email là bắt buộc",
  }),
});

export const resetSchema = Joi.object({
  token: Joi.string().required().messages({
    "string.empty": "Token không được để trống",
    "any.required": "Token là bắt buộc",
  }),
  newPassword: Joi.string().min(6).max(128).required().messages({
    "string.empty": "Mật khẩu mới không được để trống",
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu mới không được quá 128 ký tự",
    "any.required": "Mật khẩu mới là bắt buộc",
  }),
});
