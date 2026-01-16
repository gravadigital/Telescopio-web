import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CreateEventPage.css';

interface CreateEventFormData {
  name: string;
  description: string;
  date: string;
  organizer: string;
  maxParticipants: number;
}

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user: currentUser } = useAuth();

  // Get tomorrow's date in YYYY-MM-DD format (local timezone)
  // Backend requires start_date to be in the future (not today)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<CreateEventFormData>({
    name: '',
    description: '',
    date: '',
    organizer: '',
    maxParticipants: 20
  });
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const minDate = getTomorrowDate();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/events');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    console.log(`Field changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) || 1 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    if (!formData.name || !formData.description || !formData.date) {
      setError('All fields are required.');
      setCreating(false);
      return;
    }
    
    if (formData.name.length < 3) {
      setError('Event name must be at least 3 characters long.');
      setCreating(false);
      return;
    }
    
    if (formData.name.length > 200) {
      setError('Event name cannot exceed 200 characters.');
      setCreating(false);
      return;
    }
    
    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long.');
      setCreating(false);
      return;
    }
    
    if (formData.description.length > 2000) {
      setError('Description cannot exceed 2000 characters.');
      setCreating(false);
      return;
    }

    try {
      // NO incluir author_id - el backend lo toma del token JWT automáticamente
      console.log('📤 Creating event with authenticated user token');
      console.log('📋 Event data:', formData);

      const newEvent = await EventService.createEvent(formData);
      console.log('✅ Event created successfully:', newEvent);
      
      // Redirect to the new event's detail page
      navigate(`/events/${newEvent.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show more specific error message
      let errorMessage = 'Error creating event. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('DUPLICATE_EVENT_NAME')) {
          errorMessage = 'An event with this name already exists. Please choose a different name.';
        } else if (error.message.includes('PAST_START_DATE')) {
          errorMessage = 'Start date cannot be in the past. Please select a future date.';
        } else if (error.message.includes('INVALID_DATE_RANGE')) {
          errorMessage = 'End date must be after start date.';
        } else if (error.message.includes('DURATION_TOO_SHORT')) {
          errorMessage = 'Event duration must be at least 1 day.';
        } else if (error.message.includes('DURATION_TOO_LONG')) {
          errorMessage = 'Event duration cannot exceed 1 year.';
        } else if (error.message.includes('INVALID_PAYLOAD')) {
          errorMessage = 'Invalid form data. Please check all required fields.';
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  // Check if form is valid for submission
  const nameValid = formData.name.trim().length >= 3 && formData.name.length <= 200;
  const descValid = formData.description.trim().length >= 10 && formData.description.length <= 2000;
  const dateValid = formData.date.trim().length > 0;

  const isFormValid = nameValid && descValid && dateValid;

  console.log('📋 Form validation:', {
    name: formData.name,
    nameValid,
    nameLength: formData.name.length,
    description: formData.description,
    descValid,
    descriptionLength: formData.description.length,
    date: formData.date,
    dateValid,
    isFormValid,
    'button disabled?': creating || !isFormValid
  });

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        {/* Header */}
        <div className="create-event-header">
          <button onClick={handleCancel} className="btn btn-secondary btn-sm back-button">
            ← Back to Events
          </button>
          <h1>Create New Event</h1>
          <p className="subtitle">Set up a new astronomical observation event</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="create-event-form-container">
          <form onSubmit={handleSubmit} className="create-event-form">
            <div className="form-section">
              <h3>Event Details</h3>
              
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Event Name <span className="required">*</span>
                </label>
                <input
                  id="name"
                  className="form-input"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Jupiter Observation 2026"
                  maxLength={200}
                />
                <small className="form-help">Give your event a descriptive name (3-200 characters)</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Describe the astronomical event, objectives, and what participants can expect... (minimum 10 characters)"
                  rows={6}
                  maxLength={2000}
                />
                <small className="form-help">
                  Provide detailed information about the event (10-2000 characters) - Current: {formData.description.length}/2000
                </small>
              </div>
            </div>

            <div className="form-section">
              <h3>Schedule & Organization</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="date">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  id="date"
                  className="form-input"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={minDate}
                />
                <small className="form-help">When will the event begin? (Must be a future date)</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="organizer">
                  Organizer
                </label>
                <input
                  id="organizer"
                  className="form-input"
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleChange}
                  placeholder="Organization or person organizing the event"
                />
                <small className="form-help">Who is organizing this event? (Optional)</small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="maxParticipants">
                  Maximum Participants
                </label>
                <input
                  id="maxParticipants"
                  className="form-input"
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  min={1}
                  max={100}
                  placeholder="20"
                />
                <small className="form-help">Maximum number of participants allowed (1-100, default: 20)</small>
              </div>
            </div>


            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary btn-lg"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !isFormValid}
                className="btn btn-primary btn-lg"
                style={{ opacity: (creating || !isFormValid) ? 0.5 : 1 }}
              >
                {creating ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Creating Event...
                  </>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;
