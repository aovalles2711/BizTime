const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

/** GET/companies */

router.get("/", async function (req, res, next) {
    try {
        const result = await db.query (
            `SELECT code, name
            FROM companies
            ORDER BY name`
        );
        return res.json({"companies: result.rows"});
    }

    catch (err) {
        return next(err);
    }
});

/** GET/companies/[code] */

router.get("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;

        const compResult = await db.query (
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [code]
        );

        // const invResult = await db.query(
        //     `SELECT id
        //     FROM invoices
        //     WHERE comp_code = $1`,
        //     [code]
        // );

        if (compResult.rows.length === 0) {
            throw new ExpressError('No such company exists: ${code}', 404)
        }

        const company = comp.Results.rows[0];

        return res.json({"company": company});
    }

    catch (err) {
        return next(err);
    }
});

/** POST/companies - add company in JSON response **/

router.post("/", async function(req, res, next) {
    try {
        let {name, description} = req.body;
        let code = name;

        const result = await db.query (
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]);
        
            return res.status(201).json({"company": result.rows[0]});
    }

    catch(err) {
        return next(err);
    }
});

/** PUT/companies[code]: Edit existing company and return 404 if company not found **/

router.put("/:code", async function(req, res, next) {
    try {
        let {name, description} = req.body;
        let code = req.params.code;

        const result = await db.query (
            `UPDATE companies
            SET name=$1, description=$2
            WHERE code = $3
            RETURNING name, description, code`,
            [name, description, code]);
        
        if (result.rows.length === 0) {
            throw new ExpressError(`No such company exists: ${code}`, 404)
        } else {
            return res.json({"company": result.rows[0]});
        }
    }

    catch (err) {
        return next(err);
    }

});

/** DELETE /[code] to delete company. Return 404 if company cannot be found. Return status in JSON response. */

router.delete("/:code", async function(req, res, next) {
    try {
        let code = req.params.code;

        const result = await db.query (
            `DELETE FROM companies
            WHERE code=$1
            RETURNING code`,
            [code]);

        if (result.rowCount.length == 0) {
            throw new ExpressError(`No such company exists: ${code}`, 404)
        } else {
            return res.json({"status": "deleted"});
        }
    }

    catch (err) {
        return next(err);
    }
});


module.exports = router;