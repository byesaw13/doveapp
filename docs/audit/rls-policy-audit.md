# RLS Policy Audit

## accounts

- SELECT: "Users can view their accounts" (038:16) - account_id = (SELECT account_id FROM account_memberships WHERE user_id = auth.uid())
- UPDATE: "Owners can update their account" (038:27) - role = 'OWNER' AND account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid())

## account_memberships

- SELECT: "Users can view account memberships" (038:72) - user_id = auth.uid() OR account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
- INSERT/UPDATE/DELETE: "Admins can manage memberships" (038:83) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))

## clients

- SELECT: "Authenticated users can view clients" (077:11) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid())
- INSERT/UPDATE/DELETE: "Admins can manage clients" (077:11) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))

## jobs

- SELECT: "Admins can view jobs" (075:14) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
- SELECT: "Techs can view assigned jobs" (075:49) - assigned_tech_id = auth.uid()
- INSERT/UPDATE/DELETE: "Admins can manage jobs" (075:27) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))

## properties

- SELECT: "Account members can view properties" (074:38) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid())
- INSERT/UPDATE/DELETE: "Admins can manage properties" (074:48) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))

## job_notes

- SELECT: "Admins can view notes" (079:15) - account_id IN (SELECT account_id FROM account_memberships WHERE user_id = auth.uid() AND role IN ('OWNER','ADMIN'))
- SELECT: "Techs can view notes for assigned jobs" (079:28) - EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_notes.job_id AND j.assigned_tech_id = auth.uid())
- INSERT: "Techs can insert notes for assigned jobs" (079:41) - technician_id = auth.uid() AND EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_notes.job_id AND j.assigned_tech_id = auth.uid() AND j.account_id = job_notes.account_id)

## Findings

- Policies seem comprehensive for MVP Spine tables.
- No missing INSERT policies noted.
- WITH CHECK on INSERT for job_notes ensures consistency.
