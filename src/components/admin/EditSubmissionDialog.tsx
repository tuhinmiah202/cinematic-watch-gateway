
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submissionService, PendingSubmission } from '@/services/submissionService';

interface EditSubmissionDialogProps {
  submission: PendingSubmission;
  onUpdate: () => void;
}

const EditSubmissionDialog = ({ submission, onUpdate }: EditSubmissionDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(submission.title);
  const [description, setDescription] = useState(submission.description || '');
  const [releaseYear, setReleaseYear] = useState(submission.release_year?.toString() || '');
  const [contentType, setContentType] = useState(submission.content_type);
  const [voteAverage, setVoteAverage] = useState(submission.vote_average?.toString() || '');

  const handleSave = async () => {
    const updates: Partial<PendingSubmission> = {
      title,
      description,
      release_year: releaseYear ? parseInt(releaseYear) : undefined,
      content_type: contentType,
      vote_average: voteAverage ? parseFloat(voteAverage) : undefined
    };

    const success = await submissionService.updateSubmission(submission.id, updates);
    
    if (success) {
      toast({
        title: "Updated",
        description: "Submission details updated successfully.",
      });
      setOpen(false);
      onUpdate();
    } else {
      toast({
        title: "Error",
        description: "Failed to update submission.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-white border-white/20">
          <Edit className="w-3 h-3 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Submission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-white">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <Label className="text-white">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Release Year</Label>
              <Input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-white">Rating</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={voteAverage}
                onChange={(e) => setVoteAverage(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-white">Content Type</Label>
            <Select value={contentType} onValueChange={(value: 'movie' | 'series') => setContentType(value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="movie" className="text-white">Movie</SelectItem>
                <SelectItem value="series" className="text-white">Series</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubmissionDialog;
