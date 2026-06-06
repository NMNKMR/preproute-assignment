import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { CreateEditTest } from '@/pages/CreateEditTest'
import { AddQuestions } from '@/pages/AddQuestions'
import { PreviewPublish } from '@/pages/PreviewPublish'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tests/new" element={<CreateEditTest />} />
          <Route path="/tests/:id/edit" element={<CreateEditTest />} />
          <Route path="/tests/:id/questions" element={<AddQuestions />} />
          <Route path="/tests/:id/preview" element={<PreviewPublish />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
