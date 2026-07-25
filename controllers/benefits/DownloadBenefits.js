const axios = require('axios');
const { validationResult } = require('express-validator');
const fs = require('node:fs/promises');
const path = require('node:path');
const generateSecret = require('../../scripts/generateSecret.js');
const sendResult = require('../../scripts/sendResult.js');
const determineBenefitPath = require('../../scripts/determineBenefitPath.js');

const benefitsZipPath = path.join(process.env.STELLA_BENEFITS_DIR, 'compiled-benefits.zip');

const prefix = '[DownloadBenefits]:';

const VALID_BENEFIT_TYPES = new Set(['3dmigoto', 'addons', 'presets', 'shaders', '3dmigoto-mods']);

exports.downloadBenefit = async (req, res) => {
	try {
		const { benefitType } = req.query;
		if (!benefitType || !VALID_BENEFIT_TYPES.has(benefitType)) {
			return sendResult(res, { status: 400, message: 'Invalid or missing benefitType.' });
		}

		const authHeader = req.headers['authorization'];
		if (!authHeader) return sendResult(res, { status: 401, message: 'Missing authorization header.' });

		// Validate session through API
		const { data } = await axios.get(`${process.env.STELLA_API}/mirror/validate-session`, {
			headers: { 'X-Secret-Key': generateSecret(), 'X-Authorization': authHeader },
		});

		if (!data?.success) return sendResult(res, { status: 403, message: 'Session validation failed.' });

		// Determine file path
		const filePath = determineBenefitPath(benefitType);
		if (!filePath) {
			console.error(prefix, `Benefit file not found for type=${benefitType}`);
			return sendResult(res, { status: 404, message: 'Benefit file not found.' });
		}

		try {
			await fs.access(filePath);
		} catch {
			console.error(prefix, `Benefit file not found at path=${filePath}`);
			return sendResult(res, { status: 404, message: 'Benefit file not found.' });
		}

		// Send file
		console.log(prefix, `Serving ${benefitType} (benefitId=${data.benefitId}) from ${filePath}`);
		res.download(filePath, err => {
			if (err && !res.headersSent) sendResult(res, { status: 500, message: 'File transfer failed.' });
		});
	} catch (err) {
		if (err.response?.data?.message) return sendResult(res, { status: err.response.status, message: err.response.data.message });
		sendResult(res, { status: err.status || 500, message: err.message || 'Internal server error' });
	}
};

exports.download = async (req, res) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) return sendResult(res, { status: 400, message: errors.array() });

		const { userId, registrySecretKey } = req.params;

		// API validates device status, subscription, and mirror match
		const { data } = await axios.get(`${process.env.STELLA_API}/mirror/download-check`, {
			headers: { 'X-Registry-Secret-Key': registrySecretKey, 'X-Secret-Key': generateSecret(), 'X-User-IP': req.ip },
		});

		// Captcha redirect
		if (!data?.success) return sendResult(res, { status: 403, message: 'Session validation failed.' });

		if (!data.verified) {
			if (!data.registrySecretKey) return sendResult(res, { status: 403, message: 'Session validation failed.' });
			return res.status(307).redirect(`${process.env.PATRON_CENTER}/benefits/stella-mod-plus/receive/${userId}/${data.registrySecretKey}/captcha`);
		}

		try {
			await fs.access(benefitsZipPath);
		} catch {
			console.error(prefix, `Zip file not found at path ${benefitsZipPath}`);
			return sendResult(res, { status: 500, message: 'Something went wrong. Please report this error.' });
		}

		const safeUsername = (data.username || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
		const downloadName = `${safeUsername}-stella-plus-benefits.zip`;

		// Send file - mark as downloaded only after successful transfer
		console.log(prefix, `Serving ${downloadName}`);
		res.download(benefitsZipPath, downloadName, downloadErr => {
			if (downloadErr) {
				if (!res.headersSent) sendResult(res, { status: 500, message: 'File transfer failed.' });
				console.error(prefix, 'File transfer failed:', downloadErr.message);
				return;
			}

			axios.patch(`${process.env.STELLA_API}/mirror/device/status`, {
				status: { downloaded: true },
			}, { headers: { 'X-User-IP': req.ip, 'X-Registry-Secret-Key': registrySecretKey, 'X-Secret-Key': generateSecret() } })
				.catch(patchErr => console.error(prefix, 'Failed to update download status:', patchErr.message));
		});
	} catch (err) {
		console.error(err.stack);

		if (err.response?.data?.message) return sendResult(res, { status: err.response.status, message: err.response.data.message });
		sendResult(res, { status: err.status || 500, message: err.message || 'Internal server error' });
	}
};
