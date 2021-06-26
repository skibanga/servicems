# Copyright (c) 2021, Aakvatech Limited and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import nowdate, nowtime


class ServiceJobCard(Document):
    def validate(self):
        self.update_tabels()
        self.set_totals()

    def before_submit(self):
        self.create_matrial_transfer("before_submit")

    def update_tabels(self):
        for temp in self.services:
            if not temp.applied:
                temp_doc = frappe.get_doc("Service Template", temp.service)
                if temp_doc.tasks:
                    for task in temp_doc.tasks:
                        row = self.append("tasks", {})
                        row.task_name = task.task_name
                        row.template = temp_doc.name

                if temp_doc.parts:
                    for part in temp_doc.parts:
                        row = self.append("parts", {})
                        row.part_name = part.part_name
                        row.item = part.item
                        row.type = part.type
                        row.qty = part.qty
                        row.rate = part.rate
                        row.is_billable = part.is_billable

                temp.applied = 1

    def set_totals(self):
        self.service_charges = 0
        self.spares_cost = 0
        self.total = 0

        if self.services:
            for el in self.services:
                if el.is_billable:
                    self.service_charges += el.rate
        if self.parts:
            for el in self.parts:
                if el.is_billable:
                    self.spares_cost += el.rate * el.qty
        if self.supplied_patrs:
            for el in self.supplied_patrs:
                if el.is_billable:
                    self.spares_cost += el.rate * el.qty

        self.total = self.service_charges + self.spares_cost

    @frappe.whitelist()
    def create_stock_entry(self, type):
        if self.parts and len(self.parts) > 0:
            workshop = frappe.get_doc("Service Workshop", self.workshop)
            items = []
            for item in self.parts:
                if item.qty > 0:
                    items.append(
                        {
                            "s_warehouse": workshop.parts_warehouse,
                            "t_warehouse": workshop.workshop_warehouse,
                            "item_code": item.item,
                            "qty": item.qty,
                            "uom": frappe.get_value("Item", item.item, "stock_uom"),
                        }
                    )

            if len(items) == 0:
                return

            doc = frappe.get_doc(
                dict(
                    doctype="Stock Entry",
                    posting_date=nowdate(),
                    posting_time=nowtime(),
                    stock_entry_type="Material Transfer",
                    purpose="Material Transfer",
                    company=self.company,
                    from_warehouse=workshop.parts_warehouse,
                    to_warehouse=workshop.workshop_warehouse,
                    items=items,
                ),
            )
            frappe.flags.ignore_account_permission = True
            doc.insert(ignore_permissions=True)
            doc.submit()

            left_parts = []
            for row in self.parts:
                if row.qty > 0:
                    new_row = self.append("supplied_patrs", {})
                    new_row.part_name = row.part_name
                    new_row.item = row.item
                    new_row.type = row.type
                    new_row.qty = row.qty
                    new_row.rate = row.rate
                    new_row.is_billable = row.is_billable
                    new_row.stock_entry = doc.name
                else:
                    left_parts.append(row)
            self.parts = left_parts
            if type == "call":
                self.save()
