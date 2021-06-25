# Copyright (c) 2021, Aakvatech Limited and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ServiceJobCard(Document):
    def validate(self):
        self.update_tabels()

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
