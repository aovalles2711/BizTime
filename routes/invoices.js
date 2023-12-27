const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

let router = new express.Router();

/** GET list of invoices in JSON response */

router.get("/", async function (req, res, next) {
    try {
        const result = await db.query (
            `SELECT id, comp_Code
            FROM invoices
            ORDER BY id`
        );

        return res.json({"invoices": result.rows});
    }

    catch (err) {
        return next(err);
    }
});

/** GET details on invoices in JSON response */

router.get("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query (
            `SELECT i.id, i.comp_Code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
            FROM invoices AS i
            INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id = $1`
            [id]);
        
            if (result.rows.length === 0) {
                throw new ExpressError(`No such invoice exists: ${id}`, 404);
            }

            const data = result.rows[0];
            const invoice = {
                id: data.id,
                company: {
                    code: data.comp_Code,
                    name: data.name,
                    description: data.description,
                },
                amt: data.amt,
                paid: data.paid,
                add_date: data.add_date,
                paid_date: data.paid_date,
            };

            return res.json({"invoice": invoice});
    }

    catch(err) {
        return next(err);
    }
});

/** POST add new invoice in JSON response */

router.post("/", async function (req, res, next) {
    try {
        let {comp_Code, amt} = req.body;

        const result = await db.query (
            `INSERT INTO invoices (comp_Code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_Code, amt, paid, add_date, paid_date`,
            [comp_Code, amt]);
        
            return res.json({"invoice": result.rows[0]});
    }

    catch (err) {
        return (err);
    }
});

/** PUT update existing invoice. If invoice cannot be found, returns 404. JSON response. */

router.put("/:id", async function (req, res, next) {
    try {
        let {amt, paid} = req.body;
        let id = req.params.id;
        let paidDate = null;

        const currResult = await db.query (
            `SELECT paid
            FROM invoices
            WHERE id = $1`,
            [id]);
        
            if (currResult.rows.length === 0) {
                throw new ExpressError(`No such invoice exists: ${id}`, 404);
            }

            const currPaidDate = currResult.rows[0].paid_date;

            if (!currPaidDate && paid) {
                paidDate = new Date();
            } else if (!paid) {
                paidDate = null
            } else {
                paidDate = currPaidDate;
            }

            const result = await db.query (
                `UPDATE invoices
                SET amt=$1, paid=$2, paid_date=$3
                WHERE id=$4
                RETURNING id, comp_Code, amt, paid, add_date, paid_date`,
                [amt, paid, paidDate, id]);
            
                return res.json({"invoice": result.rows[0]});
    }

    catch (err) {
        return next(err);
    }

});

/** DELETE /[code] delete invoice. If it does not exist return 404 status response. JSON response. */

router.delete('/:id', async function(req, res, next) {
    try {
        let id = req.params.id;

        const result = await db.query (
            `DELETE FROM invoices
            WHERE id = $1
            RETURNING id`,
            [id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such invoice exists: ${id}`, 404);
        }

        return res.json({"status": "deleted"});
    }

    catch(err) {
        return next(err);
    }
});


module.exports = router;